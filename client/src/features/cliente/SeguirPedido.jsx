import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Card, Button, Input, Badge, Spinner, Empty } from '../../components/ui.jsx';
import { moneda, fechaHora, badgePedido, TIPOS_PEDIDO } from '../../lib/format.js';
import { Search, CheckCircle2 } from 'lucide-react';

const PASOS = ['CREADO', 'CONFIRMADO', 'RECIBIDO_COCINA', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'FINALIZADO'];
const INDICES = { CREADO: 0, CONFIRMADO: 1, RECIBIDO_COCINA: 2, EN_PREPARACION: 3, LISTO: 4, ENTREGADO: 5, FINALIZADO: 6 };

export default function SeguirPedido() {
  const [params, setParams] = useSearchParams();
  const qc = useQueryClient();
  const codigoInicial = params.get('codigo') || '';
  const [codigo, setCodigo] = useState(codigoInicial);

  const { data: pedido, isLoading, isError, error } = useQuery({
    queryKey: ['seguir-pedido', codigo],
    queryFn: () => api.get(`/client/orders/${codigo}`),
    enabled: !!codigo,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Seguir mi pedido</h1>
        <p className="text-sm text-ink-500">Ingresa el código que te entregaron al pedir</p>
      </div>

      <div className="flex gap-2">
        <Input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="Ej: L20260808-001" />
        <Button onClick={() => setParams({ codigo })} disabled={!codigo}><Search size={15} /></Button>
      </div>

      {isLoading && <Spinner />}
      {isError && <div className="text-sm text-red-600">{error?.response?.data?.error || 'No se pudo consultar el pedido'}</div>}

      {pedido && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-lg">{pedido.codigo}</span>
                  <Badge color={badgePedido(pedido.estado).color}>{badgePedido(pedido.estado).label}</Badge>
                </div>
                <div className="text-sm text-ink-500 mt-1">
                  {TIPOS_PEDIDO[pedido.tipo]?.emoji} {TIPOS_PEDIDO[pedido.tipo]?.label} · {fechaHora(pedido.createdAt)}
                </div>
              </div>
              <div className="text-xl font-bold text-brand-600">{moneda(pedido.total)}</div>
            </div>
          </Card>

          <Card title="Progreso">
            <div className="flex items-center">
              {PASOS.slice(0, -1).map((p, i) => {
                const alcanzado = INDICES[pedido.estado] >= i;
                const cancelado = pedido.estado === 'CANCELADO' || pedido.estado === 'RECHAZADO';
                return (
                  <React.Fragment key={p}>
                    <div className="flex flex-col items-center gap-1">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${cancelado ? 'bg-red-100 text-red-500' : alcanzado ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                        <CheckCircle2 size={16} />
                      </div>
                      <span className={`text-[10px] text-center ${alcanzado && !cancelado ? 'font-semibold text-brand-700' : 'text-ink-400'}`}>{badgePedido(p).label}</span>
                    </div>
                    {i < PASOS.length - 2 && <div className={`flex-1 h-0.5 mb-4 ${alcanzado && !cancelado ? 'bg-brand-600' : 'bg-ink-100'}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          </Card>

          <Card title="Detalle" pad={false}>
            {pedido.items?.map((i) => (
              <div key={i.id} className="flex justify-between px-4 py-3 border-b border-ink-50 text-sm">
                <span>{i.cantidad} × {i.producto.nombre}</span>
                <span className="font-medium">{moneda(i.precio * i.cantidad)}</span>
              </div>
            ))}
            {pedido.observaciones && <div className="px-4 py-3 text-sm text-ink-500">Observaciones: {pedido.observaciones}</div>}
          </Card>

          <Card title="Historial">
            <div className="space-y-2">
              {pedido.history?.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge color={badgePedido(h.estado).color}>{badgePedido(h.estado).label}</Badge>
                    {h.comentario && <span className="text-ink-400 text-xs">{h.comentario}</span>}
                  </div>
                  <span className="text-xs text-ink-400">{fechaHora(h.createdAt)}{h.user?.nombre ? ` · ${h.user.nombre}` : ''}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
