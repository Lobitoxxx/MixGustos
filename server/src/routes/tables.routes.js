import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';

const router = Router();
router.use(auth);

// GET /api/tables
router.get('/', requirePermiso('mesas.ver'), async (_req, res) => {
  const tables = await prisma.table.findMany({
    orderBy: { numero: 'asc' },
    include: {
      pedidos: {
        where: { estado: { notIn: ['FINALIZADO', 'CANCELADO', 'RECHAZADO'] } },
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { producto: true } },
        },
      },
    },
  });
  return ok(res, tables);
});

// POST /api/tables
router.post('/', requirePermiso('mesas.gestionar'), async (req, res) => {
  const { numero, nombre, capacidad } = req.body;
  if (!numero) return fail(res, 'Numero de mesa requerido');
  try {
    const table = await prisma.table.create({
      data: { numero, nombre: nombre || `Mesa ${numero}`, capacidad: capacidad || 4 },
    });
    return ok(res, table, 201);
  } catch {
    return fail(res, 'Ya existe una mesa con ese numero', 409);
  }
});

// PUT /api/tables/:id
router.put('/:id', requirePermiso('mesas.gestionar'), async (req, res) => {
  const { numero, nombre, capacidad, estado } = req.body;
  try {
    const table = await prisma.table.update({
      where: { id: req.params.id },
      data: { numero, nombre, capacidad, estado },
    });
    return ok(res, table);
  } catch {
    return fail(res, 'Mesa no encontrada', 404);
  }
});

// PATCH /api/tables/:id/estado
router.patch('/:id/estado', requirePermiso('mesas.gestionar'), async (req, res) => {
  const { estado } = req.body;
  const table = await prisma.table.update({ where: { id: req.params.id }, data: { estado } });
  return ok(res, table);
});

// DELETE /api/tables/:id
router.delete('/:id', requirePermiso('mesas.gestionar'), async (req, res) => {
  const count = await prisma.order.count({ where: { mesaId: req.params.id } });
  if (count > 0) return fail(res, 'No se puede eliminar: tiene pedidos asociados', 409);
  await prisma.table.delete({ where: { id: req.params.id } });
  return ok(res, { ok: true });
});

export default router;
