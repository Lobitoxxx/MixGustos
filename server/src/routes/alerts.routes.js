import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';
import { detectarAlertas } from '../services/alertas.js';

const router = Router();
router.use(auth);

// GET /api/alerts
router.get('/', requirePermiso('almacen.ver'), async (req, res) => {
  const alerts = await prisma.alert.findMany({
    where: req.query.estado ? { estado: req.query.estado } : {},
    include: { producto: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return ok(res, alerts);
});

// POST /api/alerts/check  (regenera alertas de vencimiento/stock)
router.post('/check', requirePermiso('almacen.gestionar'), async (_req, res) => {
  const creadas = await detectarAlertas();
  return ok(res, { creadas: creadas.length });
});

// PATCH /api/alerts/:id
router.patch('/:id', requirePermiso('almacen.ver'), async (req, res) => {
  const { estado } = req.body;
  if (!['NUEVA', 'VISTA', 'RESUELTA'].includes(estado)) return fail(res, 'Estado invalido');
  const alerta = await prisma.alert.update({ where: { id: req.params.id }, data: { estado } });
  return ok(res, alerta);
});

export default router;
