import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Badge, Spinner, Empty } from '../../components/ui.jsx';
import { moneda, fechaHora, badgePedido, TIPOS_PEDIDO } from '../../lib/format.js';

export default function PedidosCliente() {
  const { data, isLoading } = useQuery({ queryKey: ['pedidos-cliente'], queryFn: () => api.get('/client/orders') });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mis pedidos</h1>
        <p className="text-sm text-ink-500">Historial de tus pedidos recientes</p>
      </div>

      {data?.length === 0 && <Empty text="Aún no has hecho pedidos" />}
      <div className="space-y-3">
        {data?.map((o) => {
          const st = badgePedido(o.estado);
          return (
            <Card key={o.id}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold">{o.codigo}</span>
                    <Badge color={st.color}>{st.label}</Badge>
                  </div>
                  <div className="text-sm text-ink-500 mt-1">
                    {TIPOS_PEDIDO[o.tipo]?.emoji} {TIPOS_PEDIDO[o.tipo]?.label} · {fechaHora(o.createdAt)}
                    {o.clienteNombre && <> · {o.clienteNombre}</>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-brand-600">{moneda(o.total)}</div>
                  <div className="text-xs text-ink-400">{o.items?.length} producto(s)</div>
                </div>
              </div>
              <div className="mt-3 border-t border-ink-100 pt-3 space-y-1.5">
                {o.items?.map((i) => (
                  <div key={i.id} className="flex justify-between text-sm">
                    <span>{i.cantidad} × {i.producto.nombre}</span>
                    <span className="font-medium">{moneda(i.precio * i.cantidad)}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
