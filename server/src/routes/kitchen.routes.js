import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';
import { emitPedidoEstado, emitPedidoListo, emitConsumoRealizado } from '../socket/index.js';
import { procesarConsumoItem } from '../services/fefoPeps.js';

const router = Router();
router.use(auth, requirePermiso('cocina.ver'));

const kitchenInclude = {
  mesa: true,
  createdBy: { select: { nombre: true } },
  items: { include: { producto: { include: { categoria: true } } } },
};

// GET /api/kitchen/orders
router.get('/orders', async (req, res) => {
  const orders = await prisma.order.findMany({
    where: {
      estado: { in: ['CONFIRMADO', 'RECIBIDO_COCINA', 'EN_PREPARACION', 'LISTO'] },
    },
    include: kitchenInclude,
    orderBy: [{ createdAt: 'asc' }],
  });
  return ok(res, orders);
});

// POST /api/kitchen/orders/:id/recibir
router.post('/orders/:id/recibir', requirePermiso('cocina.gestionar'), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (order.estado !== 'CONFIRMADO') return fail(res, 'Solo se reciben pedidos confirmados');

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      estado: 'RECIBIDO_COCINA',
      history: { create: { estado: 'RECIBIDO_COCINA', userId: req.user.id, comentario: 'Recibido por cocina' } },
    },
    include: kitchenInclude,
  });
  emitPedidoEstado(updated);
  return ok(res, updated);
});

// POST /api/kitchen/orders/:id/preparar
router.post('/orders/:id/preparar', requirePermiso('cocina.gestionar'), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (!['RECIBIDO_COCINA', 'CONFIRMADO'].includes(order.estado)) {
    return fail(res, 'El pedido no puede pasar a preparacion');
  }

  await prisma.orderItem.updateMany({
    where: { orderId: order.id, estado: { in: ['SOLICITADO'] } },
    data: { estado: 'EN_PREPARACION' },
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      estado: 'EN_PREPARACION',
      history: { create: { estado: 'EN_PREPARACION', userId: req.user.id, comentario: 'En preparacion' } },
    },
    include: kitchenInclude,
  });
  emitPedidoEstado(updated);
  return ok(res, updated);
});

// POST /api/kitchen/orders/:id/listo
router.post('/orders/:id/listo', requirePermiso('cocina.gestionar'), async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order) return fail(res, 'Pedido no encontrado', 404);
  if (!['RECIBIDO_COCINA', 'EN_PREPARACION'].includes(order.estado)) {
    return fail(res, 'El pedido no puede marcarse como listo');
  }

  await prisma.orderItem.updateMany({
    where: { orderId: order.id, estado: { in: ['SOLICITADO', 'EN_PREPARACION'] } },
    data: { estado: 'LISTO' },
  });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      estado: 'LISTO',
      history: { create: { estado: 'LISTO', userId: req.user.id, comentario: 'Pedido listo' } },
    },
    include: kitchenInclude,
  });

  // Consumo de inventario: receta -> ingredientes -> FEFO/PEPS
  const consumptions = [];
  for (const item of order.items) {
    const resultado = await procesarConsumoItem(item.id);
    if (resultado.consumptions.length) {
      consumptions.push(...resultado.consumptions);
    }
  }

  emitPedidoListo(updated);
  if (consumptions.length) emitConsumoRealizado(consumptions[0]);
  return ok(res, { order: updated, consumptions: consumptions.length });
});

export default router;
