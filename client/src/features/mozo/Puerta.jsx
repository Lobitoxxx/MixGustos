import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Card, Button, Badge, Empty, Spinner, Input, useToast } from '../../components/ui.jsx';
import { moneda, badgePedido, TIPOS_PEDIDO, fechaHora } from '../../lib/format.js';
import { getSocket } from '../../socket.js';
import { Plus, PackageCheck, CheckCircle2, Search } from 'lucide-react';

export default function Puerta() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [buscar, setBuscar] = useState('');
  const [resultado, setResultado] = useState(null);
  const [noEncontrado, setNoEncontrado] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['pedidos-puerta'],
    queryFn: () => api.get('/orders?tipo=PARA_LLEVAR').then((r) => r),
  });
  const { data: recoger } = useQuery({
    queryKey: ['pedidos-recoger'],
    queryFn: () => api.get('/orders?tipo=PARA_RECOGER').then((r) => r),
  });

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const invalidar = () => {
      qc.invalidateQueries({ queryKey: ['pedidos-puerta'] });
      qc.invalidateQueries({ queryKey: ['pedidos-recoger'] });
    };
    const aviso = (o) => {
      invalidar();
      toast.info(
        'Cliente pide aviso por WhatsApp',
        `Pedido ${o.codigo}: el cliente quiere que lo contacten al ${o.telefono || '—'} cuando esté listo.`
      );
    };
    s.on('pedido:estado', invalidar);
    s.on('pedido:listo', invalidar);
    s.on('pedido:aviso', aviso);
    return () => {
      s.off('pedido:estado', invalidar);
      s.off('pedido:listo', invalidar);
      s.off('pedido:aviso', aviso);
    };
  }, [qc, toast]);

  const entregar = useMutation({
    mutationFn: (id) => api.post(`/orders/${id}/entregar`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos-puerta'] });
      qc.invalidateQueries({ queryKey: ['pedidos-recoger'] });
    },
  });
  const finalizar = useMutation({
    mutationFn: (id) => api.post(`/orders/${id}/finalizar`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pedidos-puerta'] });
      qc.invalidateQueries({ queryKey: ['pedidos-recoger'] });
    },
  });

  async function buscarPedido(e) {
    e.preventDefault();
    setNoEncontrado(false);
    setResultado(null);
    try {
      const o = await api.get(`/client/orders/${buscar.trim()}`);
      setResultado(o);
    } catch {
      setNoEncontrado(true);
    }
  }

  if (isLoading) return <Spinner />;

  const pendientes = (data || []).filter((o) => ['CONFIRMADO', 'RECIBIDO_COCINA', 'EN_PREPARACION'].includes(o.estado));
  const listos = (data || []).filter((o) => ['LISTO', 'ENTREGADO'].includes(o.estado));
  const recogerPend = (recoger || []).filter((o) => ['CONFIRMADO', 'RECIBIDO_COCINA', 'EN_PREPARACION'].includes(o.estado));
  const recogerListos = (recoger || []).filter((o) => ['LISTO', 'ENTREGADO'].includes(o.estado));

  function OrdenCard({ o }) {
    return (
      <div className="rounded-xl border border-ink-100 p-4 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono font-bold text-lg">{o.codigo}</span>
            <Badge className="ml-2" color={badgePedido(o.estado).color}>{badgePedido(o.estado).label}</Badge>
          </div>
          <span className="font-bold text-brand-600">{moneda(o.total)}</span>
        </div>
        <div className="mt-1 text-xs text-ink-400">{o.clienteNombre} · {fechaHora(o.createdAt)}</div>
        <div className="mt-2 space-y-0.5">
          {o.items.map((i) => (
            <div key={i.id} className="text-sm text-ink-700">
              <span className="font-medium">{i.cantidad}×</span> {i.producto.nombre}
              {i.observaciones && <span className="text-amber-600 text-xs"> · {i.observaciones}</span>}
            </div>
          ))}
        </div>
        {(o.estado === 'LISTO' || o.estado === 'ENTREGADO') && (
          <div className="mt-3 flex gap-2">
            {o.estado === 'LISTO' && (
              <Button size="sm" className="flex-1" onClick={() => entregar.mutate(o.id)}><PackageCheck size={14} /> Entregar</Button>
            )}
            {o.estado === 'ENTREGADO' && (
              <Button size="sm" variant="success" className="flex-1" onClick={() => finalizar.mutate(o.id)}><CheckCircle2 size={14} /> Finalizar</Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Puerta · Para llevar y recoger</h1>
          <p className="text-sm text-ink-500">Gestión de pedidos de clientes en puerta</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/pedido/nuevo')}><Plus size={16} /> Nuevo pedido</Button>
        </div>
      </div>

      <Card title="Buscar pedido por código" subtitle="Identifica pedidos listos por código o número">
        <form onSubmit={buscarPedido} className="flex gap-2">
          <Input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Ej: L20260108-001" className="max-w-xs" />
          <Button type="submit" variant="secondary"><Search size={15} /> Buscar</Button>
        </form>
        {noEncontrado && <div className="mt-2 text-sm text-red-600">Pedido no encontrado</div>}
        {resultado && <OrdenCard o={resultado} />}
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Para llevar" subtitle={`${pendientes.length} en preparación · ${listos.length} listos`}>
          {pendientes.length === 0 && listos.length === 0 ? (
            <Empty text="Sin pedidos para llevar" />
          ) : (
            <div className="space-y-3">
              {[...listos, ...pendientes].map((o) => <OrdenCard key={o.id} o={o} />)}
            </div>
          )}
        </Card>

        <Card title="Para recoger" subtitle={`${recogerPend.length} en preparación · ${recogerListos.length} listos`}>
          {recogerPend.length === 0 && recogerListos.length === 0 ? (
            <Empty text="Sin pedidos para recoger" />
          ) : (
            <div className="space-y-3">
              {[...recogerListos, ...recogerPend].map((o) => <OrdenCard key={o.id} o={o} />)}
            </div>
          )}
        </Card>
      </div>

      <Card title="Últimos pedidos atendidos">
        {(data || []).filter((o) => ['FINALIZADO'].includes(o.estado)).slice(0, 5).length === 0 ? (
          <Empty text="Aún no se finalizaron pedidos" />
        ) : (
          <div className="flex gap-3 overflow-x-auto scroll-thin">
            {(data || []).filter((o) => o.estado === 'FINALIZADO').slice(0, 5).map((o) => (
              <div key={o.id} className="min-w-[200px] rounded-lg border border-ink-100 p-3">
                <div className="font-mono font-medium text-sm">{o.codigo}</div>
                <div className="text-xs text-ink-400">{o.clienteNombre}</div>
                <div className="font-semibold text-sm mt-1">{moneda(o.total)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
