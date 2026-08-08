import { io } from 'socket.io-client';

let socket = null;

export function conectarSocket(token) {
  if (socket) socket.disconnect();
  socket = io('/', { auth: { token } });
  return socket;
}

export function desconectarSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket() {
  return socket;
}
