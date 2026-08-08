import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Badge, Empty, Spinner, PageHeader, ProgressBar } from '../../components/ui.jsx';
import { fechaHora, TIPOS_PEDIDO } from '../../lib/format.js';
import { useToast } from '../../components/ui.jsx';
import { getSocket } from '../../socket.js';
import { ChefHat, CheckCheck, CookingPot, BellRing, Timer } from 'lucide-react';

const COLUMNAS = [
  { estado: 'CONFIRMADO', label: 'Nuevos', color: 'border-blue-200 bg-blue-50/50', dot: 'bg-blue-500', accent: 'text-blue-600' },
  { estado: 'EN_PREPARACION', label: 'En preparación', color: 'border-amber-200 bg-amber-50/50', dot: 'bg-amber-500', accent: 'text-amber-600' },
  { estado: 'LISTO', label: 'Listos', color: 'border-green-200 bg-green-50/50', dot: 'bg-green-500', accent: 'text-green-600' },
];

function useTiempo() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function tiempoDesde(iso, now) {
  const mins = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'recién';
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `hace ${h}h ${m}m`;
}

export default function Cocina() {
  const qc = useQueryClient();
  const toast = useToast();
  const [sonando, setSonando] = useState(false);
  const now = useTiempo();

  const { data, isLoading } = useQuery({
    queryKey: ['cocina'],
    queryFn: () => api.get('/kitchen/orders'),
    refetchInterval: 5000,
  });

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const invalidar = () => qc.invalidateQueries({ queryKey: ['cocina'] });
    const nuevo = () => { invalidar(); sonar(); };
    s.on('pedido:nuevo', nuevo);
    s.on('pedido:estado', invalidar);
    return () => {
      s.off('pedido:nuevo', nuevo);
      s.off('pedido:estado', invalidar);
    };
  }, [qc]);

  function sonar() {
    setSonando(true);
    setTimeout(() => setSonando(false), 3000);
  }

  const accion = (path, okMsg) =>
    useMutation({
      mutationFn: (id) => api.post(`/kitchen/orders/${id}/${path}`),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['cocina'] });
        qc.invalidateQueries({ queryKey: ['pedidos'] });
        toast.success(okMsg);
      },
      onError: (err) => toast.error('Error', err.response?.data?.error),
    });

  const recibir = accion('recibir', 'Pedido recibido en cocina');
  const preparar = accion('preparar', 'Pedido en preparación');
  const listo = accion('listo', 'Pedido listo — avisado al mozo');

  if (isLoading) return <Spinner text="Cargando cocina..." />;

  const orders = data || [];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Cocina"
        subtitle={`${orders.filter((o) => o.estado === 'EN_PREPARACION').length} en preparación · ${orders.filter((o) => o.estado === 'LISTO').length} listos para entregar`}
        icon={<ChefHat size={20} />}
        actions={sonando && (
          <div className="flex items-center gap-2 rounded-full bg-red-600 text-white px-4 py-2 text-sm font-medium animate-pulse shadow-lg shadow-red-600/30">
            <BellRing size={16} /> Nuevo pedido recibido
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNAS.map((col) => {
          const colOrders = orders.filter((o) => o.estado === col.estado);
          return (
            <div key={col.estado} className={`rounded-2xl border ${col.color} p-3 min-h-[220px] flex flex-col`}>
              <div className="flex items-center justify-between px-1.5 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                  <h3 className={`font-semibold text-sm ${col.accent}`}>{col.label}</h3>
                </div>
                <span className="text-xs font-bold bg-white rounded-full px-2 py-0.5 border border-ink-100 shadow-sm tabular-nums">
                  {colOrders.length}
                </span>
              </div>
              <div className="space-y-3 flex-1">
                {colOrders.map((o) => {
                  const listos = o.items.filter((i) => i.estado === 'LISTO').length;
                  const progreso = o.items.length ? (listos / o.items.length) * 100 : 0;
                  return (
                    <div key={o.id} className="rounded-xl bg-white border border-ink-100 shadow-sm p-4 hover:shadow-md transition-shadow animate-fade-in-up">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-ink-900">{o.codigo}</span>
                        <div className="flex items-center gap-2 text-xs text-ink-400">
                          {TIPOS_PEDIDO[o.tipo]?.emoji} {o.mesa?.nombre || ''}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-ink-400 truncate">{o.clienteNombre || 'Cliente'}</span>
                        <span className={`inline-flex items-center gap-1 font-medium ${col.estado === 'CONFIRMADO' && o.createdAt ? 'text-amber-600' : 'text-ink-400'}`}>
                          <Timer size={11} /> {o.createdAt ? tiempoDesde(o.createdAt, now) : ''}
                        </span>
                      </div>
                      <div className="space-y-1.5 mb-2">
                        {o.items.map((i) => (
                          <div key={i.id} className="text-sm flex items-start justify-between gap-2">
                            <span className={i.estado === 'LISTO' ? 'line-through opacity-60' : ''}>
                              <b>{i.cantidad}×</b> {i.producto.nombre}
                            </span>
                            {i.estado === 'LISTO' && <Badge color="bg-green-50 text-green-700 border-green-200" className="shrink-0">ok</Badge>}
                          </div>
                        ))}
                      </div>
                      {col.estado === 'EN_PREPARACION' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] text-ink-400 mb-1">
                            <span>Progreso del plato</span><span>{listos}/{o.items.length}</span>
                          </div>
                          <ProgressBar value={listos} max={o.items.length} />
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        {col.estado === 'CONFIRMADO' && (
                          <Button size="sm" className="flex-1" onClick={() => recibir.mutate(o.id)}><ChefHat size={14} /> Recibir</Button>
                        )}
                        {col.estado === 'EN_PREPARACION' && (
                          <Button size="sm" variant="primary" className="flex-1" onClick={() => listo.mutate(o.id)}><CheckCheck size={14} /> Marcar listo</Button>
                        )}
                        {col.estado === 'CONFIRMADO' && (
                          <Button size="sm" variant="secondary" onClick={() => preparar.mutate(o.id)}><CookingPot size={14} /> Preparar</Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {colOrders.length === 0 && <Empty text="Sin pedidos aquí" />}
              </div>
            </div>
          );
        })}
      </div>

      <Card title="Pedidos listos esperando entrega" subtitle="Notificados automáticamente al mozo correspondiente" icon={<CheckCheck size={15} />} pad={false}>
        {orders.filter((o) => o.estado === 'LISTO').length === 0 ? (
          <Empty text="No hay pedidos listos por entregar" />
        ) : (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders.filter((o) => o.estado === 'LISTO').map((o) => (
              <div key={o.id} className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-3.5 animate-fade-in-up">
                <span className="h-9 w-9 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                  <CheckCheck size={16} />
                </span>
                <div className="min-w-0">
                  <div className="font-mono font-bold text-ink-900">{o.codigo}</div>
                  <div className="text-xs text-ink-500 truncate">
                    {TIPOS_PEDIDO[o.tipo]?.label}{o.mesa ? ` · ${o.mesa.nombre}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
