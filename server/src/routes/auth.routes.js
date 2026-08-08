import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { auth } from '../middleware/auth.js';
import { PERMISOS_DEFAULT } from '../lib/permisos.js';
import { ok, fail } from '../lib/http.js';

const router = Router();

export function signToken(user) {
  return jwt.sign({ sub: user.id, rol: user.rol }, config.jwtSecret, { expiresIn: '12h' });
}

function publicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { usuario, password } = req.body;
  if (!usuario || !password) return fail(res, 'Usuario y contrasena requeridos');

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: usuario }, { email: usuario }] },
  });
  if (!user || !user.activo) return fail(res, 'Credenciales invalidas', 401);
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return fail(res, 'Credenciales invalidas', 401);

  const rp = await prisma.rolePermission.findUnique({ where: { rol: user.rol } });
  const permisos = rp?.permisos || PERMISOS_DEFAULT[user.rol] || [];

  return ok(res, {
    token: signToken(user),
    user: { ...publicUser(user), permisos },
  });
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  const rp = await prisma.rolePermission.findUnique({ where: { rol: req.user.rol } });
  const permisos = rp?.permisos || PERMISOS_DEFAULT[req.user.rol] || [];
  return ok(res, { user: { ...publicUser(req.user), permisos } });
});

export default router;
