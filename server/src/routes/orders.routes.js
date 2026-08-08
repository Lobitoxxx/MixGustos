import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';
import { emitPedidoEstado, emitPedidoNuevo, emitPedidoListo } from '../socket/index.js';

const router = Router();
router.use(auth);

const orderInclude = {
  mesa: true,
  createdBy: { select: { id: true, nombre: true, username: true } },
  assignedTo: { select: { id: true, nombre: true, username: true } },
  items: { include: { producto: { include: { categoria: true } } } },
  history: { include: { user: { select: { nombre: true } } }, orderBy: { createdAt: 'asc' } },
};

// ------------------------------------------------------------
// Generacion de codigo secuencial por dia
// ------------------------------------------------------------
async function generarCodigo(tipo) {
  const fecha = new Date();
  const ymd = fecha.toISOString().slice(0, 10).replace(/-/g, '');
  const prefijo = tipo === 'MESA' ? 'M' : tipo === 'PARA_LLEVAR' ? 'L' : 'R';
  const count = await prisma.order.count({
    where: { codigo: { startsWith: `${prefijo}${ymd}` } },
  });
  return `${prefijo}${ymd}-${String(count + 1).padStart(3, '0')}`;
}

function publicOrder(order) {
  return order;
}

// ------------------------------------------------------------
// GET /api/orders?estado=&tipo=
// ------------------------------------------------------------
router.get('/', requirePermiso('pedidos.ver'), async (req, res) => {
  const where = {};
  if (req.query.estado) where.estado = req.query.estado;
  if (req.query.tipo) where.tipo = req.query.tipo;
  if (req.query.mesaId) where.mesaId = req.query.mesaId;
  if (req.user.rol === 'MOZO_SALON') {
    where.OR = [{ createdById: req.user.id }, { assignedToId: req.user.id }];
  }
  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, orders);
});

// GET /api/orders/:id
router.get('/:id', requirePermiso('pedidos.ver'), async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: orderInclude,
  });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  return ok(res, publicOrder(order));
});

// ------------------------------------------------------------
// POST /api/orders  { tipo, mesaId, clienteNombre, telefono, observaciones, items:[{productoId, cantidad, observaciones}] }
// ------------------------------------------------------------
router.post('/', requirePermiso('pedidos.crear'), async (req, res) => {
  const { tipo, mesaId, clienteNombre, telefono, observaciones, items } = req.body;
  if (!['MESA', 'PARA_LLEVAR', 'PARA_RECOGER'].includes(tipo)) return fail(res, 'Tipo de pedido invalido');
  if (!Array.isArray(items) || items.length === 0) return fail(res, 'El pedido debe tener al menos un producto');

  if (tipo === 'MESA') {
    if (!mesaId) return fail(res, 'Se requiere una mesa para pedidos en salon');
    const mesa = await prisma.table.findUnique({ where: { id: mesaId } });
    if (!mesa) return fail(res, 'Mesa no encontrada', 404);
    if (mesa.estado === 'RESERVADA') return fail(res, 'La mesa esta reservada');
  }

  const codigo = await generarCodigo(tipo);

  const productos = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productoId) } },
  });
  const map = Object.fromEntries(productos.map((p) => [p.id, p]));

  const detalles = items.map((i) => {
    const p = map[i.productoId];
    if (!p) throw Object.assign(new Error(`Producto inexistente: ${i.productoId}`), { status: 400 });
    return {
      productoId: p.id,
      cantidad: Number(i.cantidad),
      precio: p.precioVenta,
      observaciones: i.observaciones,
    };
  });

  const total = detalles.reduce((acc, d) => acc + d.precio * d.cantidad, 0);

  const order = await prisma.order.create({
    data: {
      codigo,
      tipo,
      mesaId: tipo === 'MESA' ? mesaId : null,
      clienteNombre,
      telefono,
      observaciones,
      createdById: req.user.id,
      total,
      estado: 'CREADO',
      items: { create: detalles },
      history: { create: { estado: 'CREADO', userId: req.user.id, comentario: 'Pedido creado' } },
    },
    include: orderInclude,
  });

  if (tipo === 'MESA' && mesaId) {
    await prisma.table.update({ where: { id: mesaId }, data: { estado: 'OCUPADA' } });
  }

  emitPedidoEstado(publicOrder(order));
  return ok(res, publicOrder(order), 201);
});

// ------------------------------------------------------------
// PUT /api/orders/:id  (modificar mientras CREADO/CONFIRMADO, antes de cocina)
// ------------------------------------------------------------
router.put('/:id', requirePermiso('pedidos.modificar'), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (!['CREADO', 'CONFIRMADO'].includes(order.estado)) {
    return fail(res, 'Solo se pueden modificar pedidos en estado CREADO o CONFIRMADO');
  }

  const { items, observaciones, clienteNombre, telefono } = req.body;
  const data = { observaciones, clienteNombre, telefono };

  if (Array.isArray(items)) {
    const productos = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productoId) } } });
    const map = Object.fromEntries(productos.map((p) => [p.id, p]));
    const detalles = items.map((i) => ({
      productoId: i.productoId,
      cantidad: Number(i.cantidad),
      precio: map[i.productoId]?.precioVenta || 0,
      observaciones: i.observaciones,
    }));
    const total = detalles.reduce((acc, d) => acc + d.precio * d.cantidad, 0);

    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.createMany({ data: detalles.map((d) => ({ ...d, orderId: order.id })) });
    data.total = total;
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data,
    include: orderInclude,
  });
  emitPedidoEstado(publicOrder(updated));
  return ok(res, publicOrder(updated));
});

// ------------------------------------------------------------
// POST /api/orders/:id/confirmar
// ------------------------------------------------------------
router.post('/:id/confirmar', requirePermiso('pedidos.confirmar'), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (!['CREADO'].includes(order.estado)) return fail(res, 'Solo se confirman pedidos en estado CREADO');

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      estado: 'CONFIRMADO',
      history: { create: { estado: 'CONFIRMADO', userId: req.user.id, comentario: 'Pedido confirmado y enviado a cocina' } },
    },
    include: orderInclude,
  });
  emitPedidoNuevo(publicOrder(updated));
  return ok(res, publicOrder(updated));
});

// ------------------------------------------------------------
// POST /api/orders/:id/cancelar
// ------------------------------------------------------------
router.post('/:id/cancelar', requirePermiso('pedidos.cancelar'), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (['FINALIZADO', 'CANCELADO', 'RECHAZADO'].includes(order.estado)) {
    return fail(res, 'El pedido ya no puede cancelarse');
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      estado: 'CANCELADO',
      history: { create: { estado: 'CANCELADO', userId: req.user.id, comentario: req.body.comentario || 'Cancelado' } },
    },
    include: orderInclude,
  });

  if (order.tipo === 'MESA' && order.mesaId) {
    const activos = await prisma.order.count({
      where: { mesaId: order.mesaId, estado: { notIn: ['FINALIZADO', 'CANCELADO', 'RECHAZADO'] } },
    });
    if (activos === 0) await prisma.table.update({ where: { id: order.mesaId }, data: { estado: 'LIBRE' } });
  }

  emitPedidoEstado(publicOrder(updated));
  return ok(res, publicOrder(updated));
});

// ------------------------------------------------------------
// POST /api/orders/:id/entregar  (mozo entrega al cliente)
// ------------------------------------------------------------
router.post('/:id/entregar', requirePermiso('pedidos.entregar'), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (order.estado !== 'LISTO') return fail(res, 'Solo se entregan pedidos en estado LISTO');

  await prisma.orderItem.updateMany({
    where: { orderId: order.id, estado: { in: ['LISTO', 'SOLICITADO', 'EN_PREPARACION'] } },
    data: { estado: 'ENTREGADO' },
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      estado: 'ENTREGADO',
      history: { create: { estado: 'ENTREGADO', userId: req.user.id, comentario: 'Entregado al cliente' } },
    },
    include: orderInclude,
  });
  emitPedidoEstado(publicOrder(updated));
  return ok(res, publicOrder(updated));
});

// ------------------------------------------------------------
// POST /api/orders/:id/finalizar  (cierre de pedido / cobro)
// ------------------------------------------------------------
router.post('/:id/finalizar', requirePermiso('pedidos.entregar'), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (!['LISTO', 'ENTREGADO'].includes(order.estado)) {
    return fail(res, 'El pedido debe estar LISTO o ENTREGADO para finalizarse');
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      estado: 'FINALIZADO',
      history: { create: { estado: 'FINALIZADO', userId: req.user.id, comentario: 'Pedido finalizado' } },
    },
    include: orderInclude,
  });

  if (order.tipo === 'MESA' && order.mesaId) {
    const activos = await prisma.order.count({
      where: { mesaId: order.mesaId, estado: { notIn: ['FINALIZADO', 'CANCELADO', 'RECHAZADO'] } },
    });
    if (activos === 0) await prisma.table.update({ where: { id: order.mesaId }, data: { estado: 'LIBRE' } });
  }

  emitPedidoEstado(publicOrder(updated));
  return ok(res, publicOrder(updated));
});

export { orderInclude };
export default router;
