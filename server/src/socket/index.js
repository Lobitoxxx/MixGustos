import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../lib/prisma.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: config.clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No autorizado'));
      const payload = jwt.verify(token, config.jwtSecret);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Token invalido'));
    }
  });

  io.on('connection', async (socket) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: socket.userId } });
      if (!user) return socket.disconnect(true);
      socket.join(`rol:${user.rol}`);
      socket.join(`user:${user.id}`);
      socket.emit('auth:ok', { userId: user.id, rol: user.rol });
    } catch {
      socket.disconnect(true);
    }
  });

  return io;
}

export function getIo() {
  return io;
}

// Eventos de dominio
export function emitPedidoListo(order) {
  if (!io) return;
  io.to('rol:MOZO_SALON').to('rol:MOZO_PUERTA').emit('pedido:listo', order);
  if (order.createdById) io.to(`user:${order.createdById}`).emit('pedido:listo', order);
}

export function emitPedidoEstado(order) {
  if (!io) return;
  io.to('rol:MOZO_SALON').to('rol:MOZO_PUERTA').to('rol:COCINERO').emit('pedido:estado', order);
  if (order.createdById) io.to(`user:${order.createdById}`).emit('pedido:estado', order);
}

export function emitPedidoNuevo(order) {
  if (!io) return;
  io.to('rol:COCINERO').emit('pedido:nuevo', order);
}

export function emitPedidoAviso(order) {
  if (!io) return;
  io.to('rol:MOZO_SALON').to('rol:MOZO_PUERTA').emit('pedido:aviso', order);
}

export function emitAlerta(alerta) {
  if (!io) return;
  io.to('rol:ALMACENERO').to('rol:GERENTE').to('rol:ADMINISTRADOR').emit('alerta:nueva', alerta);
}

export function emitConsumoRealizado(consumption) {
  if (!io) return;
  io.to('rol:ALMACENERO').to('rol:GERENTE').emit('consumo:realizado', consumption);
}
