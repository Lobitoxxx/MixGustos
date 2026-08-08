import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { auth } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';

const router = Router();
router.use(auth);

const editableProps = ['nombre', 'telefono', 'foto', 'preferencias', 'notificaciones'];

// GET /api/perfil
router.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, username: true, email: true, rol: true, nombre: true,
      telefono: true, foto: true, preferencias: true, notificaciones: true, createdAt: true,
    },
  });
  return ok(res, user);
});

// PUT /api/perfil
router.put('/', async (req, res) => {
  const data = {};
  for (const prop of editableProps) {
    if (prop in req.body) data[prop] = req.body[prop];
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id: true, username: true, email: true, rol: true, nombre: true,
      telefono: true, foto: true, preferencias: true, notificaciones: true,
    },
  });
  return ok(res, user);
});

// PUT /api/perfil/password
router.put('/password', async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  if (!passwordActual || !passwordNueva) return fail(res, 'Contrasena actual y nueva requeridas');
  if (passwordNueva.length < 6) return fail(res, 'La contrasena nueva debe tener al menos 6 caracteres');

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  const valid = await bcrypt.compare(passwordActual, user.password);
  if (!valid) return fail(res, 'Contrasena actual incorrecta', 400);

  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: await bcrypt.hash(passwordNueva, 10) },
  });
  return ok(res, { ok: true });
});

export default router;
