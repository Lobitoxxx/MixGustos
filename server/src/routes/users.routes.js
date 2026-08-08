import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { PERMISOS_DEFAULT, PERMISOS_GENERALES } from '../lib/permisos.js';
import { ok, fail } from '../lib/http.js';

const router = Router();
const ROLES = ['ADMINISTRADOR', 'GERENTE', 'MOZO_SALON', 'MOZO_PUERTA', 'COCINERO', 'ALMACENERO', 'CLIENTE'];

router.use(auth);

const selectPublic = {
  id: true,
  username: true,
  email: true,
  rol: true,
  nombre: true,
  telefono: true,
  foto: true,
  activo: true,
  preferencias: true,
  notificaciones: true,
  createdAt: true,
};

// GET /api/users
router.get('/', requirePermiso('usuarios.gestionar'), async (req, res) => {
  const users = await prisma.user.findMany({ select: selectPublic, orderBy: { createdAt: 'desc' } });
  return ok(res, users);
});

// POST /api/users
router.post('/', requirePermiso('usuarios.gestionar'), async (req, res) => {
  const { username, email, password, rol, nombre, telefono, foto } = req.body;
  if (!username || !email || !password || !rol || !nombre) return fail(res, 'Campos obligatorios incompletos');
  if (!ROLES.includes(rol)) return fail(res, 'Rol invalido');

  const exists = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (exists) return fail(res, 'El nombre de usuario o correo ya existe', 409);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: await bcrypt.hash(password, 10),
      rol,
      nombre,
      telefono,
      foto,
    },
    select: selectPublic,
  });
  return ok(res, user, 201);
});

// PUT /api/users/:id
router.put('/:id', requirePermiso('usuarios.gestionar'), async (req, res) => {
  const { username, email, rol, nombre, telefono, foto, activo, password } = req.body;
  const data = { username, email, rol, nombre, telefono, foto, activo };
  if (password) data.password = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: selectPublic,
    });
    return ok(res, user);
  } catch {
    return fail(res, 'Usuario no encontrado o datos en conflicto', 409);
  }
});

// PATCH /api/users/:id/estado
router.patch('/:id/estado', requirePermiso('usuarios.gestionar'), async (req, res) => {
  const { activo } = req.body;
  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { activo: !!activo },
    select: selectPublic,
  });
  return ok(res, user);
});

// GET /api/users/roles/permisos
router.get('/roles/permisos', requirePermiso('permisos.gestionar'), async (_req, res) => {
  const rolePerms = await prisma.rolePermission.findMany();
  const permisosPorRol = {};
  for (const r of ROLES) {
    const rp = rolePerms.find((x) => x.rol === r);
    permisosPorRol[r] = rp?.permisos || PERMISOS_DEFAULT[r];
  }
  return ok(res, { roles: ROLES, permisosDisponibles: PERMISOS_GENERALES, permisosPorRol });
});

// PUT /api/users/roles/permisos/:rol
router.put('/roles/permisos/:rol', requirePermiso('permisos.gestionar'), async (req, res) => {
  const { rol } = req.params;
  const { permisos } = req.body;
  if (!ROLES.includes(rol)) return fail(res, 'Rol invalido');
  const validos = permisos.filter((p) => PERMISOS_GENERALES.includes(p));
  const rp = await prisma.rolePermission.upsert({
    where: { rol },
    update: { permisos: validos },
    create: { rol, permisos: validos },
  });
  return ok(res, rp);
});

export default router;
