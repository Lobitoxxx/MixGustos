import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok } from '../lib/http.js';

const router = Router();
router.use(auth);

// GET /api/settings
router.get('/', async (_req, res) => {
  let setting = await prisma.setting.findFirst();
  if (!setting) {
    setting = await prisma.setting.create({ data: {} });
  }
  return ok(res, setting);
});

// PUT /api/settings
router.put('/', requirePermiso('configuracion.gestionar'), async (req, res) => {
  const campos = [
    'nombreRestaurante', 'moneda', 'igv', 'metodoInventario',
    'diasProximosVencer', 'umbralDiferencia', 'ruc', 'direccion',
    'telefono', 'horarioAtencion', 'politicaFEFO',
  ];
  const data = {};
  for (const c of campos) {
    if (c in req.body) data[c] = req.body[c];
  }
  const existing = await prisma.setting.findFirst();
  const setting = existing
    ? await prisma.setting.update({ where: { id: existing.id }, data })
    : await prisma.setting.create({ data });
  return ok(res, setting);
});

export default router;
