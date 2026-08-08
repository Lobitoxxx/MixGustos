export function moneda(n, moneda = 'S/') {
  return `${moneda} ${Number(n || 0).toFixed(2)}`;
}

export function fecha(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function fechaHora(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('es-PE', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export const ESTADOS_PEDIDO = {
  CREADO: { label: 'Creado', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  CONFIRMADO: { label: 'Confirmado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  RECIBIDO_COCINA: { label: 'Recibido por cocina', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  EN_PREPARACION: { label: 'En preparación', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  LISTO: { label: 'Listo', color: 'bg-green-50 text-green-700 border-green-200' },
  ENTREGADO: { label: 'Entregado', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  FINALIZADO: { label: 'Finalizado', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELADO: { label: 'Cancelado', color: 'bg-red-50 text-red-700 border-red-200' },
  RECHAZADO: { label: 'Rechazado', color: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const TIPOS_PEDIDO = {
  MESA: { label: 'En mesa', emoji: '🍽️' },
  PARA_LLEVAR: { label: 'Para llevar', emoji: '🥡' },
  PARA_RECOGER: { label: 'Para recoger', emoji: '📦' },
};

export function badgePedido(estado) {
  return ESTADOS_PEDIDO[estado] || { label: estado, color: 'bg-slate-100 text-slate-700 border-slate-200' };
}
