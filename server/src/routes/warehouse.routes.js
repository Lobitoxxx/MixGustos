import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';
import {
  stockProducto,
  stockPorLotes,
  ordenarLotes,
  getMetodoProducto,
  registrarEntrada,
  consumirProducto,
  registrarMerma,
} from '../services/fefoPeps.js';
import { emitAlerta } from '../socket/index.js';

const router = Router();
router.use(auth);

// ============================================================
// INVENTARIO
// ============================================================

// GET /api/warehouse/inventory  (stock por producto con desglose por lote)
router.get('/inventory', requirePermiso('inventario.ver'), async (req, res) => {
  const products = await prisma.product.findMany({
    where: { activo: true },
    include: { categoria: true },
    orderBy: { nombre: 'asc' },
  });

  const inventario = await Promise.all(
    products.map(async (p) => {
      const stock = await stockProducto(p.id);
      const lotes = await stockPorLotes(p.id);
      return {
        ...p,
        stock,
        lotes: lotes.filter((l) => l.estado !== 'AGOTADO'),
      };
    })
  );
  return ok(res, inventario);
});

// GET /api/warehouse/movements?productoId=&desde=&hasta=
router.get('/movements', requirePermiso('inventario.ver'), async (req, res) => {
  const where = {};
  if (req.query.productoId) where.productoId = req.query.productoId;
  if (req.query.desde || req.query.hasta) {
    where.createdAt = {};
    if (req.query.desde) where.createdAt.gte = new Date(req.query.desde);
    if (req.query.hasta) where.createdAt.lte = new Date(req.query.hasta);
  }
  const movements = await prisma.inventoryMovement.findMany({
    where,
    include: { producto: true, lot: true, user: { select: { nombre: true } } },
    orderBy: { createdAt: 'desc' },
    take: 500,
  });
  return ok(res, movements);
});

// ============================================================
// LOTES
// ============================================================

// GET /api/warehouse/lots?productoId=&orden=fefo|peps
router.get('/lots', requirePermiso('lotes.ver'), async (req, res) => {
  const where = {};
  if (req.query.productoId) where.productoId = req.query.productoId;
  let lotes = await prisma.lot.findMany({
    where,
    include: { producto: { include: { categoria: true } } },
    orderBy: { createdAt: 'desc' },
  });

  if (req.query.productoId && req.query.orden) {
    lotes = ordenarLotes(lotes, req.query.orden.toUpperCase());
  }
  return ok(res, lotes);
});

// GET /api/warehouse/lots/fefo?productoId=
router.get('/lots/fefo', requirePermiso('lotes.ver'), async (req, res) => {
  const { productoId } = req.query;
  if (!productoId) return fail(res, 'productoId requerido');
  const lotes = await prisma.lot.findMany({ where: { productoId } });
  return ok(res, { metodo: 'FEFO', lotes: ordenarLotes(lotes, 'FEFO') });
});

// GET /api/warehouse/lots/peps?productoId=
router.get('/lots/peps', requirePermiso('lotes.ver'), async (req, res) => {
  const { productoId } = req.query;
  if (!productoId) return fail(res, 'productoId requerido');
  const lotes = await prisma.lot.findMany({ where: { productoId } });
  return ok(res, { metodo: 'PEPS', lotes: ordenarLotes(lotes, 'PEPS') });
});

// POST /api/warehouse/lots
router.post('/lots', requirePermiso('lotes.gestionar'), async (req, res) => {
  const { productoId, cantidad, fechaIngreso, fechaVencimiento, costoUnitario } = req.body;
  if (!productoId || !cantidad) return fail(res, 'Producto y cantidad requeridos');
  const resultado = await registrarEntrada({
    productoId,
    cantidad: Number(cantidad),
    fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : new Date(),
    fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
    costoUnitario: Number(costoUnitario || 0),
    userId: req.user.id,
    motivo: 'Registro de lote',
  });
  return ok(res, resultado, 201);
});

// POST /api/warehouse/entradas
router.post('/entradas', requirePermiso('inventario.gestionar'), async (req, res) => {
  const { productoId, cantidad, lotId, fechaIngreso, fechaVencimiento, costoUnitario, motivo } = req.body;
  if (!productoId || !cantidad) return fail(res, 'Producto y cantidad requeridos');
  const resultado = await registrarEntrada({
    productoId,
    cantidad: Number(cantidad),
    lotId,
    fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : new Date(),
    fechaVencimiento: fechaVencimiento ? new Date(fechaVencimiento) : null,
    costoUnitario: Number(costoUnitario || 0),
    userId: req.user.id,
    motivo: motivo || 'Entrada manual',
  });
  return ok(res, resultado, 201);
});

// POST /api/warehouse/salidas
router.post('/salidas', requirePermiso('inventario.gestionar'), async (req, res) => {
  const { productoId, cantidad, motivo } = req.body;
  if (!productoId || !cantidad) return fail(res, 'Producto y cantidad requeridos');
  try {
    const resultado = await consumirProducto({
      productoId,
      cantidad: Number(cantidad),
      userId: req.user.id,
      motivo: motivo || 'Salida manual',
    });
    return ok(res, resultado, 201);
  } catch (e) {
    return fail(res, e.message, e.status || 409);
  }
});

// POST /api/warehouse/mermas
router.post('/mermas', requirePermiso('inventario.gestionar'), async (req, res) => {
  const { productoId, cantidad, tipo, motivo, lotId } = req.body;
  if (!productoId || !cantidad || !tipo) return fail(res, 'Producto, cantidad y tipo requeridos');
  const validos = ['VENCIDO', 'DANADO', 'DESPERDICIADO', 'ERROR_PREPARACION', 'OTRO'];
  if (!validos.includes(tipo)) return fail(res, 'Tipo de merma invalido');

  try {
    const resultado = await registrarMerma({
      productoId,
      cantidad: Number(cantidad),
      tipo,
      motivo,
      lotId,
      userId: req.user.id,
    });
    const alerta = await prisma.alert.create({
      data: {
        tipo: 'DIFERENCIA_CONSUMO',
        titulo: 'Merma registrada',
        mensaje: `Merma de ${cantidad} ${resultado.merma.producto.unidad} de ${resultado.merma.producto.nombre} (${tipo}).`,
        productoId,
        usuarioId: req.user.id,
      },
    });
    emitAlerta(alerta);
    return ok(res, resultado, 201);
  } catch (e) {
    return fail(res, e.message, 400);
  }
});

// POST /api/warehouse/ajustar  { productoId, cantidad, tipo:'AJUSTE' }
router.post('/ajustar', requirePermiso('inventario.gestionar'), async (req, res) => {
  const { productoId, cantidad, motivo } = req.body;
  if (!productoId || cantidad === undefined) return fail(res, 'Producto y cantidad requeridos');
  const n = Number(cantidad);

  if (n >= 0) {
    const r = await registrarEntrada({ productoId, cantidad: n, userId: req.user.id, motivo: motivo || 'Ajuste positivo' });
    return ok(res, r, 201);
  }
  const r = await consumirProducto({
    productoId,
    cantidad: Math.abs(n),
    userId: req.user.id,
    motivo: motivo || 'Ajuste negativo',
  });
  return ok(res, r, 201);
});

// GET /api/warehouse/proximos-vencer
router.get('/proximos-vencer', requirePermiso('inventario.ver'), async (req, res) => {
  const setting = await prisma.setting.findFirst();
  const dias = setting?.diasProximosVencer || 7;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() + dias);

  const lotes = await prisma.lot.findMany({
    where: {
      cantidadActual: { gt: 0 },
      estado: { in: ['ACTIVO'] },
      fechaVencimiento: { not: null, lte: limite },
    },
    include: { producto: { include: { categoria: true } } },
    orderBy: { fechaVencimiento: 'asc' },
  });
  return ok(res, lotes);
});

// GET /api/warehouse/vencidos
router.get('/vencidos', requirePermiso('inventario.ver'), async (_req, res) => {
  const hoy = new Date();
  const lotes = await prisma.lot.findMany({
    where: {
      cantidadActual: { gt: 0 },
      estado: 'VENCIDO',
      fechaVencimiento: { lt: hoy },
    },
    include: { producto: { include: { categoria: true } } },
    orderBy: { fechaVencimiento: 'asc' },
  });
  return ok(res, lotes);
});

// GET /api/warehouse/metodo/:productoId
router.get('/metodo/:productoId', requirePermiso('inventario.ver'), async (req, res) => {
  const metodo = await getMetodoProducto(req.params.productoId);
  return ok(res, { metodo });
});

export default router;
