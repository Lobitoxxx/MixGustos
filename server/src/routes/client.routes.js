import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requireRol } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';
import { stockProducto } from '../services/fefoPeps.js';
import { emitPedidoNuevo, emitPedidoEstado, emitPedidoAviso } from '../socket/index.js';

const router = Router();

// GET /api/client/menu  (menu publico de productos vendibles con stock)
router.get('/menu', async (_req, res) => {
  const products = await prisma.product.findMany({
    where: { esVendible: true, activo: true },
    include: { categoria: true },
    orderBy: { nombre: 'asc' },
  });
  const menu = await Promise.all(
    products.map(async (p) => ({ ...p, stock: await stockProducto(p.id) }))
  );
  return ok(res, menu);
});

// GET /api/client/tables  (mesas disponibles para que el cliente pida en mesa)
router.get('/tables', async (_req, res) => {
  const tables = await prisma.table.findMany({ orderBy: { numero: 'asc' } });
  return ok(res, tables.map((t) => ({ id: t.id, numero: t.numero, nombre: t.nombre, capacidad: t.capacidad, estado: t.estado })));
});

// GET /api/client/orders/:codigo  (seguimiento por codigo, sin sesion)
router.get('/orders/:codigo', async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { codigo: req.params.codigo },
    include: {
      items: { include: { producto: true } },
      history: { include: { user: { select: { nombre: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  return ok(res, order);
});

// POST /api/client/orders/:codigo/telefono  (cliente registra su WhatsApp y avisa al mozo, sin sesion)
router.post('/orders/:codigo/telefono', async (req, res) => {
  const { telefono } = req.body;
  const order = await prisma.order.findUnique({ where: { codigo: req.params.codigo } });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (order.estado === 'FINALIZADO' || order.estado === 'CANCELADO' || order.estado === 'RECHAZADO') {
    return fail(res, 'Este pedido ya está cerrado');
  }

  const tel = String(telefono || '').replace(/[^0-9]/g, '');
  if (tel && tel.length < 8) return fail(res, 'El número de WhatsApp no es válido');

  await prisma.order.update({ where: { id: order.id }, data: { telefono: tel || null } });

  emitPedidoAviso({
    id: order.id,
    codigo: order.codigo,
    telefono: tel || null,
    clienteNombre: order.clienteNombre,
    tipo: order.tipo,
    mesaId: order.mesaId,
    estado: order.estado,
  });

  return ok(res, { ...order, telefono: tel || null });
});

// POST /api/client/orders  (pedido del cliente: mesa / llevar / recoger)
router.post('/orders', auth, requireRol('CLIENTE'), async (req, res) => {
  const { tipo, mesaId, clienteNombre, telefono, observaciones, items } = req.body;
  if (!['MESA', 'PARA_LLEVAR', 'PARA_RECOGER'].includes(tipo)) return fail(res, 'Tipo de pedido invalido');
  if (!Array.isArray(items) || items.length === 0) return fail(res, 'El pedido debe tener al menos un producto');

  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefijo = tipo === 'MESA' ? 'M' : tipo === 'PARA_LLEVAR' ? 'L' : 'R';
  const count = await prisma.order.count({ where: { codigo: { startsWith: `${prefijo}${fecha}` } } });
  const codigo = `${prefijo}${fecha}-${String(count + 1).padStart(3, '0')}`;

  const productos = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productoId) } } });
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
      mesaId: tipo === 'MESA' ? mesaId || null : null,
      clienteNombre: clienteNombre || req.user.nombre,
      telefono,
      observaciones,
      createdById: req.user.id,
      total,
      estado: 'CONFIRMADO',
      items: { create: detalles },
      history: {
        create: [
          { estado: 'CREADO', userId: req.user.id, comentario: 'Pedido creado por el cliente' },
          { estado: 'CONFIRMADO', userId: req.user.id, comentario: 'Confirmado automaticamente' },
        ],
      },
    },
    include: {
      items: { include: { producto: true } },
      history: { orderBy: { createdAt: 'asc' } },
    },
  });

  emitPedidoNuevo(order);
  emitPedidoEstado(order);
  return ok(res, order, 201);
});

// GET /api/client/orders  (pedidos del cliente autenticado)
router.get('/orders', auth, requireRol('CLIENTE'), async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { createdById: req.user.id },
    include: { items: { include: { producto: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ok(res, orders);
});

export default router;
