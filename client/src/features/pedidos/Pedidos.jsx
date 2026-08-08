import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Card, Button, Badge, Empty, Spinner, Table, Td, Modal, PageHeader, SegmentedControl } from '../../components/ui.jsx';
import { moneda, fechaHora, badgePedido, TIPOS_PEDIDO } from '../../lib/format.js';
import { useAuth } from '../../store/auth.js';
import { useToast } from '../../components/ui.jsx';
import { getSocket } from '../../socket.js';
import { Plus, Send, PackageCheck, CheckCircle2, XCircle, Eye, ClipboardList, Store } from 'lucide-react';

function useOrderAction(qc, path, nombre, toast) {
  return useMutation({
    mutationFn: (id) => api.post(`/orders/${id}/${path}`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['pedidos'] });
      qc.invalidateQueries({ queryKey: ['mesas'] });
      toast.success(nombre);
    },
    onError: (err) => toast.error('No se pudo completar la acción', err.response?.data?.error),
  });
}

export default function Pedidos() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { has } = useAuth();
  const toast = useToast();
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroEstado, setFiltroEstado] = useState('ACTIVOS');
  const [detalle, setDetalle] = useState(null);

  const confirmar = useOrderAction(qc, 'confirmar', 'Pedido confirmado y enviado a cocina', toast);
  const entregar = useOrderAction(qc, 'entregar', 'Pedido marcado como entregado', toast);
  const finalizar = useOrderAction(qc, 'finalizar', 'Pedido finalizado', toast);
  const cancelar = useOrderAction(qc, 'cancelar', 'Pedido cancelado', toast);

  const { data, isLoading } = useQuery({ queryKey: ['pedidos'], queryFn: () => api.get('/orders') });

  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const invalidar = () => {
      qc.invalidateQueries({ queryKey: ['pedidos'] });
      qc.invalidateQueries({ queryKey: ['mesas'] });
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

  if (isLoading) return <Spinner text="Cargando pedidos..." />;

  const porTipo = (data || []).filter((o) => filtroTipo === 'TODOS' || o.tipo === filtroTipo);
  const activos = porTipo.filter((o) => !['FINALIZADO', 'CANCELADO', 'RECHAZADO'].includes(o.estado));
  const historial = porTipo.filter((o) => ['FINALIZADO', 'CANCELADO', 'RECHAZADO'].includes(o.estado));
  const visibles = filtroEstado === 'ACTIVOS' ? activos : historial;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pedidos"
        subtitle={`${activos.length} activos · ${historial.length} cerrados`}
        icon={<ClipboardList size={20} />}
        actions={
          <>
            <SegmentedControl
              value={filtroTipo}
              onChange={setFiltroTipo}
              options={[
                { value: 'TODOS', label: 'Todos' },
                ...Object.entries(TIPOS_PEDIDO).map(([k, v]) => ({ value: k, label: `${v.emoji} ${v.label}` })),
              ]}
            />
            {has('pedidos.crear') && (
              <Button onClick={() => navigate('/pedido/nuevo')}><Plus size={16} /> Nuevo pedido</Button>
            )}
          </>
        }
      />

      <SegmentedControl
        value={filtroEstado}
        onChange={setFiltroEstado}
        options={[
          { value: 'ACTIVOS', label: `Activos (${activos.length})` },
          { value: 'HISTORIAL', label: `Historial (${historial.length})` },
        ]}
      />

      {visibles.length === 0 ? (
        <Card>
          <Empty
            text={filtroEstado === 'ACTIVOS' ? 'No hay pedidos activos con este filtro' : 'Aún no hay pedidos cerrados'}
            icon={<Store size={20} />}
            action={has('pedidos.crear') && <Button size="sm" onClick={() => navigate('/pedido/nuevo')}><Plus size={14} /> Crear pedido</Button>}
          />
        </Card>
      ) : (
        <Card pad={false}>
          <Table headers={['Código', 'Tipo', 'Cliente', 'Mesa', 'Productos', 'Total', 'Estado', 'Creado', 'Acciones']}>
            {visibles.map((o) => (
              <tr key={o.id} className="group hover:bg-ink-50/50 transition-colors">
                <Td className="font-mono font-medium">{o.codigo}</Td>
                <Td className="whitespace-nowrap">{TIPOS_PEDIDO[o.tipo]?.emoji} {TIPOS_PEDIDO[o.tipo]?.label}</Td>
                <Td>{o.clienteNombre || o.createdBy?.nombre}</Td>
                <Td>{o.mesa?.nombre || '—'}</Td>
                <Td>
                  <div className="max-w-[220px] space-y-0.5">
                    {o.items.slice(0, 3).map((i) => (
                      <div key={i.id} className="text-xs text-ink-600">
                        <span className="font-medium">{i.cantidad}×</span> {i.producto.nombre}
                        {i.observaciones && <span className="text-amber-600"> · {i.observaciones}</span>}
                      </div>
                    ))}
                    {o.items.length > 3 && <div className="text-xs text-ink-400">+{o.items.length - 3} más</div>}
                  </div>
                </Td>
                <Td className="font-semibold tabular-nums">{moneda(o.total)}</Td>
                <Td><Badge color={badgePedido(o.estado).color}>{badgePedido(o.estado).label}</Badge></Td>
                <Td className="text-xs text-ink-400 whitespace-nowrap">{fechaHora(o.createdAt)}</Td>
                <Td>
                  <div className="flex gap-1.5 flex-wrap">
                    {o.estado === 'CREADO' && has('pedidos.confirmar') && (
                      <Button size="sm" variant="success" onClick={() => confirmar.mutate(o.id)}><Send size={13} /> Confirmar</Button>
                    )}
                    {o.estado === 'LISTO' && has('pedidos.entregar') && (
                      <Button size="sm" variant="primary" onClick={() => entregar.mutate(o.id)}><PackageCheck size={13} /> Entregar</Button>
                    )}
                    {o.estado === 'ENTREGADO' && has('pedidos.entregar') && (
                      <Button size="sm" variant="success" onClick={() => finalizar.mutate(o.id)}><CheckCircle2 size={13} /> Finalizar</Button>
                    )}
                    {['CREADO', 'CONFIRMADO'].includes(o.estado) && has('pedidos.cancelar') && (
                      <Button size="sm" variant="danger" icon={<XCircle size={13} />} onClick={() => cancelar.mutate(o.id)} />
                    )}
                    <Button size="sm" variant="ghost" icon={<Eye size={13} />} onClick={() => setDetalle(o)} />
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <Modal
        open={!!detalle}
        onClose={() => setDetalle(null)}
        title={`Pedido ${detalle?.codigo}`}
        subtitle={`${detalle ? TIPOS_PEDIDO[detalle.tipo]?.label : ''}${detalle?.mesa ? ` · Mesa ${detalle.mesa.nombre}` : ''} · Creado ${detalle ? fechaHora(detalle.createdAt) : ''}`}
      >
        {detalle && (
          <div className="space-y-5">
            {detalle.observaciones && (
              <div className="rounded-xl bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-800">
                📝 {detalle.observaciones}
              </div>
            )}
            <div className="space-y-2">
              {detalle.items.map((i) => (
                <div key={i.id} className="flex items-center justify-between text-sm border-b border-ink-50 pb-2">
                  <div className="min-w-0">
                    <span className="font-medium">{i.cantidad}×</span> {i.producto.nombre}
                    {i.observaciones && <span className="text-amber-600 text-xs block">({i.observaciones})</span>}
                  </div>
                  <span className="font-medium tabular-nums shrink-0 ml-2">{moneda(i.precio * i.cantidad)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span><span className="tabular-nums">{moneda(detalle.total)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Historial de estados</div>
              <div className="space-y-0">
                {detalle.history.map((h, idx) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${idx === 0 ? 'bg-brand-500' : 'bg-ink-300'}`} />
                      {idx !== detalle.history.length - 1 && <span className="w-px flex-1 bg-ink-200" />}
                    </div>
                    <div className="pb-3">
                      <Badge color={badgePedido(h.estado).color}>{badgePedido(h.estado).label}</Badge>
                      <div className="text-xs text-ink-400 mt-1">{fechaHora(h.createdAt)} · {h.user?.nombre}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
