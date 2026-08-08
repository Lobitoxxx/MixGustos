import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok } from '../lib/http.js';
import { stockProducto, round } from '../services/fefoPeps.js';

const router = Router();
router.use(auth, requirePermiso('dashboard.ver'));

// GET /api/dashboard
router.get('/', async (_req, res) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // Ventas del dia
  const ordersHoy = await prisma.order.findMany({
    where: { createdAt: { gte: hoy }, estado: { in: ['ENTREGADO', 'FINALIZADO'] } },
  });
  const ventasHoy = round(ordersHoy.reduce((a, o) => a + o.total, 0));

  // Pedidos por estado
  const porEstado = await prisma.order.groupBy({
    by: ['estado'],
    _count: { _all: true },
    where: { estado: { in: ['CONFIRMADO', 'RECIBIDO_COCINA', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CREADO'] } },
  });

  // Productos mas vendidos (hoy)
  const itemsHoy = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: hoy }, estado: { in: ['ENTREGADO', 'FINALIZADO'] } } },
    include: { producto: true },
  });
  const acc = {};
  for (const i of itemsHoy) {
    acc[i.productoId] = acc[i.productoId] || { producto: i.producto, cantidad: 0 };
    acc[i.productoId].cantidad += i.cantidad;
  }
  const topProductos = Object.values(acc).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

  // Almacen
  const productos = await prisma.product.findMany({ where: { activo: true } });
  let stockBajo = 0;
  let stockTotal = 0;
  for (const p of productos) {
    const stock = await stockProducto(p.id);
    stockTotal += stock;
    if (p.stockMinimo > 0 && stock <= p.stockMinimo) stockBajo++;
  }

  const vencidos = await prisma.lot.count({
    where: { cantidadActual: { gt: 0 }, estado: 'VENCIDO' },
  });
  const proximosVencer = await prisma.lot.count({
    where: {
      cantidadActual: { gt: 0 },
      estado: 'ACTIVO',
      fechaVencimiento: { not: null },
      fechaVencimiento: { lte: new Date(Date.now() + 7 * 86400000) },
    },
  });

  const alertasNuevas = await prisma.alert.count({ where: { estado: 'NUEVA' } });

  return ok(res, {
    ventasHoy,
    pedidosHoy: ordersHoy.length,
    ticketPromedio: ordersHoy.length ? round(ventasHoy / ordersHoy.length) : 0,
    pedidosPorEstado: porEstado,
    topProductos,
    almacen: { stockBajo, stockTotal, vencidos, proximosVencer },
    alertasNuevas,
  });
});

export default router;
