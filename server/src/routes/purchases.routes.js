import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';
import { registrarEntrada } from '../services/fefoPeps.js';
import { sugerirCompras } from '../services/alertas.js';

const router = Router();
router.use(auth);

// ============================================================
// PROVEEDORES
// ============================================================

router.get('/suppliers', requirePermiso('proveedores.ver'), async (_req, res) => {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { nombre: 'asc' },
    include: { _count: { select: { purchaseOrders: true } } },
  });
  return ok(res, suppliers);
});

router.post('/suppliers', requirePermiso('proveedores.gestionar'), async (req, res) => {
  const { nombre, ruc, telefono, email, direccion } = req.body;
  if (!nombre) return fail(res, 'Nombre requerido');
  const supplier = await prisma.supplier.create({ data: { nombre, ruc, telefono, email, direccion } });
  return ok(res, supplier, 201);
});

router.put('/suppliers/:id', requirePermiso('proveedores.gestionar'), async (req, res) => {
  const { nombre, ruc, telefono, email, direccion, activo } = req.body;
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { nombre, ruc, telefono, email, direccion, activo },
    });
    return ok(res, supplier);
  } catch {
    return fail(res, 'Proveedor no encontrado', 404);
  }
});

router.delete('/suppliers/:id', requirePermiso('proveedores.gestionar'), async (req, res) => {
  const count = await prisma.purchaseOrder.count({ where: { proveedorId: req.params.id } });
  if (count > 0) return fail(res, 'No se puede eliminar: tiene ordenes de compra', 409);
  await prisma.supplier.delete({ where: { id: req.params.id } });
  return ok(res, { ok: true });
});

// ============================================================
// ORDENES DE COMPRA
// ============================================================

const poInclude = {
  proveedor: true,
  user: { select: { nombre: true } },
  items: { include: { producto: true } },
};

async function generarNumero() {
  const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.purchaseOrder.count({
    where: { numero: { startsWith: `OC-${fecha}` } },
  });
  return `OC-${fecha}-${String(count + 1).padStart(3, '0')}`;
}

// GET /api/purchases/orders
router.get('/orders', requirePermiso('compras.ver'), async (req, res) => {
  const where = {};
  if (req.query.estado) where.estado = req.query.estado;
  const orders = await prisma.purchaseOrder.findMany({
    where,
    include: poInclude,
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, orders);
});

// POST /api/purchases/orders  { proveedorId, fechaEsperada, observaciones, items:[{productoId, cantidadSolicitada, costoUnitario}] }
router.post('/orders', requirePermiso('compras.gestionar'), async (req, res) => {
  const { proveedorId, fechaEsperada, observaciones, items } = req.body;
  if (!proveedorId || !Array.isArray(items) || items.length === 0) {
    return fail(res, 'Proveedor y productos requeridos');
  }

  const numero = await generarNumero();
  const costoTotal = items.reduce((acc, i) => acc + Number(i.costoUnitario || 0) * Number(i.cantidadSolicitada), 0);

  const po = await prisma.purchaseOrder.create({
    data: {
      numero,
      proveedorId,
      fechaEsperada: fechaEsperada ? new Date(fechaEsperada) : null,
      observaciones,
      costoTotal,
      userId: req.user.id,
      items: {
        create: items.map((i) => ({
          productoId: i.productoId,
          cantidadSolicitada: Number(i.cantidadSolicitada),
          costoUnitario: Number(i.costoUnitario || 0),
        })),
      },
    },
    include: poInclude,
  });
  return ok(res, po, 201);
});

// POST /api/purchases/orders/:id/enviar
router.post('/orders/:id/enviar', requirePermiso('compras.gestionar'), async (req, res) => {
  const po = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: { estado: 'ENVIADA' },
    include: poInclude,
  });
  return ok(res, po);
});

// POST /api/purchases/orders/:id/cancelar
router.post('/orders/:id/cancelar', requirePermiso('compras.gestionar'), async (req, res) => {
  const po = await prisma.purchaseOrder.update({
    where: { id: req.params.id },
    data: { estado: 'CANCELADA' },
    include: poInclude,
  });
  return ok(res, po);
});

// POST /api/purchases/orders/:id/recepcion
// { recepciones: [{ itemId, cantidadRecibida, fechaVencimiento, costoUnitario }] }
router.post('/orders/:id/recepcion', requirePermiso('compras.gestionar'), async (req, res) => {
  const { recepciones } = req.body;
  if (!Array.isArray(recepciones) || recepciones.length === 0) {
    return fail(res, 'Debe indicar al menos una recepcion');
  }

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!po) return fail(res, 'Orden de compra no encontrada', 404);
  if (po.estado !== 'ENVIADA' && po.estado !== 'BORRADOR') {
    return fail(res, 'La orden debe estar ENVIADA para recibirse');
  }

  const resultado = [];
  for (const r of recepciones) {
    const item = po.items.find((x) => x.id === r.itemId);
    if (!item) continue;
    const cantidad = Number(r.cantidadRecibida);

    const { lot } = await registrarEntrada({
      productoId: item.productoId,
      cantidad,
      fechaVencimiento: r.fechaVencimiento ? new Date(r.fechaVencimiento) : null,
      costoUnitario: Number(r.costoUnitario ?? item.costoUnitario),
      userId: req.user.id,
      motivo: `Recepcion ${po.numero}`,
    });

    await prisma.purchaseOrderItem.update({
      where: { id: item.id },
      data: { cantidadRecibida: cantidad },
    });
    resultado.push({ itemId: item.id, productoId: item.productoId, cantidad, lotId: lot.id });
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: po.id },
    data: { estado: 'RECIBIDA', fechaRecepcion: new Date() },
    include: poInclude,
  });

  return ok(res, { order: updated, recepciones: resultado });
});

// GET /api/purchases/sugerencia?dias=30
router.get('/sugerencia', requirePermiso('compras.gestionar'), async (req, res) => {
  const dias = Number(req.query.dias || 30);
  const sugerencias = await sugerirCompras(dias);
  return ok(res, sugerencias);
});

export default router;
