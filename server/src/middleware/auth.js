import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

export async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'No autorizado' });
    }
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Usuario no valido o inactivo' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Sesion invalida o expirada' });
  }
}

export function requireRol(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta accion' });
    }
    next();
  };
}

export function requirePermiso(permiso) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (req.user.rol === 'ADMINISTRADOR') return next();
    try {
      const rp = await prisma.rolePermission.findUnique({ where: { rol: req.user.rol } });
      const permisos = (rp?.permisos && Array.isArray(rp.permisos)) ? rp.permisos : [];
      if (permisos.includes(permiso)) return next();
      return res.status(403).json({ error: `Permiso requerido: ${permiso}` });
    } catch {
      return res.status(500).json({ error: 'Error verificando permisos' });
    }
  };
}
