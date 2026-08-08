import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok } from '../lib/http.js';
import { round, stockProducto } from '../services/fefoPeps.js';
import { consumoTeoricoProducto } from '../services/fefoPeps.js';
import { detectarDiferenciasConsumo } from '../services/alertas.js';

const router = Router();
router.use(auth, requirePermiso('reportes.ver'));

function parseFechas(req) {
  const desde = req.query.desde ? new Date(req.query.desde) : new Date(0);
  const hasta = req.query.hasta ? new Date(req.query.hasta) : new Date();
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}

// GET /api/reports/ventas?desde=&hasta=
router.get('/ventas', async (req, res) => {
  const { desde, hasta } = parseFechas(req);
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: desde, lte: hasta },
      estado: { in: ['ENTREGADO', 'FINALIZADO'] },
    },
    include: { items: { include: { producto: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const ventasTotales = round(orders.reduce((a, o) => a + o.total, 0));
  const porDia = {};
  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    porDia[key] = (porDia[key] || 0) + o.total;
  }

  return ok(res, {
    totalPedidos: orders.length,
    ventasTotales,
    ticketPromedio: orders.length ? round(ventasTotales / orders.length) : 0,
    ventasPorDia: Object.entries(porDia).map(([fecha, total]) => ({ fecha, total: round(total) })),
  });
});

// GET /api/reports/mas-vendidos?desde=&hasta=
router.get('/mas-vendidos', async (req, res) => {
  const { desde, hasta } = parseFechas(req);
  const items = await prisma.orderItem.findMany({
    where: {
      order: { createdAt: { gte: desde, lte: hasta }, estado: { in: ['ENTREGADO', 'FINALIZADO'] } },
    },
    include: { producto: true },
  });

  const acc = {};
  for (const i of items) {
    if (!acc[i.productoId]) {
      acc[i.productoId] = { producto: i.producto, cantidad: 0, ingresos: 0 };
    }
    acc[i.productoId].cantidad += i.cantidad;
    acc[i.productoId].ingresos += i.cantidad * i.precio;
  }
  const ranking = Object.values(acc).sort((a, b) => b.cantidad - a.cantidad);
  return ok(res, ranking);
});

// GET /api/reports/consumo?desde=&hasta=
router.get('/consumo', async (req, res) => {
  const { desde, hasta } = parseFechas(req);
  const productos = await prisma.product.findMany({
    where: { esVendible: false, activo: true },
  });
  const resultados = await Promise.all(
    productos.map(async (p) => ({
      ...(await consumoTeoricoProducto(p.id, desde, hasta)),
      producto: p,
    }))
  );
  return ok(res, resultados.filter((r) => r.teorico > 0 || r.real > 0));
});

// GET /api/reports/consumo/diferencias?desde=&hasta=
router.get('/consumo/diferencias', async (req, res) => {
  const { desde, hasta } = parseFechas(req);
  const diferencias = await detectarDiferenciasConsumo(desde, hasta);
  return ok(res, diferencias);
});

// GET /api/reports/mermas?desde=&hasta=
router.get('/mermas', async (req, res) => {
  const { desde, hasta } = parseFechas(req);
  const mermas = await prisma.merma.findMany({
    where: { createdAt: { gte: desde, lte: hasta } },
    include: { producto: true, user: { select: { nombre: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const totalCosto = round(mermas.reduce((a, m) => a + m.costo, 0));
  const porTipo = {};
  for (const m of mermas) {
    porTipo[m.tipo] = (porTipo[m.tipo] || 0) + m.cantidad;
  }
  return ok(res, { mermas, totalCosto, porTipo, total: mermas.length });
});

// GET /api/reports/inventario
router.get('/inventario', async (_req, res) => {
  const productos = await prisma.product.findMany({ where: { activo: true }, include: { categoria: true } });
  const data = await Promise.all(
    productos.map(async (p) => {
      const stock = await stockProducto(p.id);
      return { ...p, stock, estado: stock <= p.stockMinimo ? 'BAJO' : stock === 0 ? 'SIN_STOCK' : 'OK' };
    })
  );
  return ok(res, data);
});

// GET /api/reports/rotacion?dias=30
router.get('/rotacion', async (req, res) => {
  const dias = Number(req.query.dias || 30);
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const productos = await prisma.product.findMany({ where: { activo: true } });
  const resultado = await Promise.all(
    productos.map(async (p) => {
      const salidas = await prisma.inventoryMovement.aggregate({
        where: { productoId: p.id, tipo: 'SALIDA', createdAt: { gte: desde } },
        _sum: { cantidad: true },
      });
      const stock = await stockProducto(p.id);
      const salidaPromedioDiaria = (salidas._sum.cantidad || 0) / dias;
      return {
        producto: p,
        salidasPeriodo: round(salidas._sum.cantidad || 0),
        salidaPromedioDiaria: round(salidaPromedioDiaria),
        stockActual: stock,
        diasCobertura: salidaPromedioDiaria > 0 ? round(stock / salidaPromedioDiaria) : null,
      };
    })
  );
  return ok(res, resultado);
});

// GET /api/reports/compras?desde=&hasta=
router.get('/compras', async (req, res) => {
  const { desde, hasta } = parseFechas(req);
  const compras = await prisma.purchaseOrder.findMany({
    where: { createdAt: { gte: desde, lte: hasta }, estado: 'RECIBIDA' },
    include: { proveedor: true, items: { include: { producto: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const totalCompras = round(compras.reduce((a, c) => a + c.costoTotal, 0));
  return ok(res, { compras, totalCompras, total: compras.length });
});

// GET /api/reports/operacion?desde=&hasta=
router.get('/operacion', async (req, res) => {
  const { desde, hasta } = parseFechas(req);
  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: desde, lte: hasta } },
    include: { history: { orderBy: { createdAt: 'asc' } } },
  });

  let tiempoPreparacionTotal = 0;
  let conTiempo = 0;
  const porEstado = {};

  for (const o of orders) {
    porEstado[o.estado] = (porEstado[o.estado] || 0) + 1;
    const creado = o.history.find((h) => h.estado === 'CREADO');
    const listo = o.history.find((h) => h.estado === 'LISTO');
    if (creado && listo) {
      tiempoPreparacionTotal += (listo.createdAt - creado.createdAt) / 60000;
      conTiempo++;
    }
  }

  return ok(res, {
    total: orders.length,
    porEstado,
    cancelados: porEstado['CANCELADO'] || 0,
    tiempoPreparacionPromedioMin: conTiempo ? round(tiempoPreparacionTotal / conTiempo) : 0,
  });
});

export default router;
