import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Select, Modal, Badge, Spinner, Table, Td, Empty } from '../../components/ui.jsx';
import { moneda, fecha } from '../../lib/format.js';
import { Plus, Send, X, Truck, PackagePlus, CalendarClock } from 'lucide-react';

const ESTADOS = {
  BORRADOR: { label: 'Borrador', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  ENVIADA: { label: 'Enviada', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  RECIBIDA: { label: 'Recibida', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  CANCELADA: { label: 'Cancelada', color: 'bg-red-50 text-red-700 border-red-200' },
};

export default function Compras() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('ordenes');

  const { data: orders, isLoading } = useQuery({ queryKey: ['compras'], queryFn: () => api.get('/purchases/orders') });
  const { data: proveedores } = useQuery({ queryKey: ['proveedores'], queryFn: () => api.get('/purchases/suppliers') });
  const { data: inventario } = useQuery({ queryKey: ['inventario'], queryFn: () => api.get('/warehouse/inventory') });
  const { data: sugerencias } = useQuery({ queryKey: ['sugerencia'], queryFn: () => api.get('/purchases/sugerencia?dias=30') });

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ proveedorId: '', fechaEsperada: '', observaciones: '', items: [] });
  const [itemRow, setItemRow] = useState({ productoId: '', cantidadSolicitada: 0, costoUnitario: 0 });
  const [recepcion, setRecepcion] = useState(null);
  const [recForm, setRecForm] = useState({});

  const crear = useMutation({
    mutationFn: (body) => api.post('/purchases/orders', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compras'] }); setModal(false); },
  });
  const enviar = useMutation({
    mutationFn: (id) => api.post(`/purchases/orders/${id}/enviar`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['compras'] }); qc.invalidateQueries({ queryKey: ['alertas'] }); },
  });
  const cancelar = useMutation({
    mutationFn: (id) => api.post(`/purchases/orders/${id}/cancelar`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['compras'] }),
  });
  const recibir = useMutation({
    mutationFn: ({ id, body }) => api.post(`/purchases/orders/${id}/recepcion`, body),
    onSuccess: () => {
      ['compras', 'inventario', 'lotes', 'alertas'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setRecepcion(null);
    },
  });

  if (isLoading) return <Spinner />;

  function abrirNueva() {
    setForm({ proveedorId: '', fechaEsperada: '', observaciones: '', items: [] });
    setItemRow({ productoId: '', cantidadSolicitada: 0, costoUnitario: 0 });
    setModal(true);
  }

  function agregarItem() {
    if (!itemRow.productoId || itemRow.cantidadSolicitada <= 0) return;
    setForm((f) => ({ ...f, items: [...f.items, itemRow] }));
    setItemRow({ productoId: '', cantidadSolicitada: 0, costoUnitario: 0 });
  }

  function abrirRecepcion(o) {
    setRecepcion(o);
    const inicial = {};
    o.items.forEach((i) => {
      inicial[i.id] = { cantidadRecibida: i.cantidadSolicitada, fechaVencimiento: '', costoUnitario: i.costoUnitario };
    });
    setRecForm(inicial);
  }

  const totalNueva = form.items.reduce((a, i) => a + Number(i.costoUnitario) * Number(i.cantidadSolicitada), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Compras</h1>
          <p className="text-sm text-ink-500">Órdenes de compra y recepción de mercadería</p>
        </div>
        <Button onClick={abrirNueva}><Plus size={16} /> Nueva orden</Button>
      </div>

      <div className="flex gap-2 border-b border-ink-100">
        {[{ id: 'ordenes', label: `Órdenes (${orders?.length || 0})` }, { id: 'sugerencia', label: 'Sugerencia de compra' }].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${tab === t.id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-600'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ordenes' && (
        <Card pad={false}>
          <Table headers={['N°', 'Proveedor', 'Estado', 'Productos', 'Costo total', 'Esperada', 'Registrado por', 'Acciones']}>
            {orders?.map((o) => (
              <tr key={o.id} className="hover:bg-ink-50/50">
                <Td className="font-mono text-xs">{o.numero}</Td>
                <Td className="font-medium">{o.proveedor.nombre}</Td>
                <Td><Badge color={ESTADOS[o.estado]?.color}>{ESTADOS[o.estado]?.label || o.estado}</Badge></Td>
                <Td>
                  <div className="text-xs text-ink-600 max-w-[220px] truncate">{o.items.map((i) => i.producto.nombre).join(', ')}</div>
                </Td>
                <Td className="font-semibold">{moneda(o.costoTotal)}</Td>
                <Td className="text-sm">{o.fechaEsperada ? fecha(o.fechaEsperada) : '—'}</Td>
                <Td className="text-sm text-ink-500">{o.user?.nombre}</Td>
                <Td>
                  <div className="flex gap-1">
                    {o.estado === 'BORRADOR' && <Button size="sm" variant="secondary" onClick={() => enviar.mutate(o.id)}><Send size={13} /> Enviar</Button>}
                    {o.estado === 'ENVIADA' && <Button size="sm" variant="secondary" onClick={() => abrirRecepcion(o)}><Truck size={13} /> Recibir</Button>}
                    {(o.estado === 'BORRADOR' || o.estado === 'ENVIADA') && <Button size="sm" variant="ghost" onClick={() => cancelar.mutate(o.id)}><X size={14} className="text-red-500" /></Button>}
                  </div>
                </Td>
              </tr>
            ))}
            {orders?.length === 0 && <tr><Td colSpan={8}><Empty text="Sin órdenes de compra" /></Td></tr>}
          </Table>
        </Card>
      )}

      {tab === 'sugerencia' && (
        <Card title="Sugerencia automática" subtitle="Basada en consumo promedio de los últimos 30 días y stock mínimo" pad={false}>
          <Table headers={['Producto', 'Stock actual', 'Stock mín.', 'Consumo diario', 'Proyección 30d', 'Sugerido comprar']}>
            {sugerencias?.filter((s) => s.sugerido > 0).map((s) => (
              <tr key={s.productoId} className="hover:bg-ink-50/50">
                <Td className="font-medium">{s.producto.nombre}</Td>
                <Td>{s.stock} {s.producto.unidad}</Td>
                <Td>{s.stockMinimo}</Td>
                <Td>{s.consumoPromedioDiario}</Td>
                <Td>{s.proyeccion}</Td>
                <Td>
                  <Badge color={s.sugerido > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                    {s.sugerido} {s.producto.unidad}
                  </Badge>
                </Td>
              </tr>
            ))}
            {sugerencias?.filter((s) => s.sugerido > 0).length === 0 && <tr><Td colSpan={6}><Empty text="No hay productos que reponer ahora" /></Td></tr>}
          </Table>
        </Card>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Nueva orden de compra" width="max-w-2xl">
        <div className="space-y-3">
          <Select label="Proveedor" value={form.proveedorId} onChange={(e) => setForm({ ...form, proveedorId: e.target.value })}>
            <option value="">Seleccionar...</option>
            {proveedores?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha esperada" type="date" value={form.fechaEsperada} onChange={(e) => setForm({ ...form, fechaEsperada: e.target.value })} />
            <Input label="Observaciones" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} />
          </div>

          <div className="border border-ink-100 rounded-xl p-3 space-y-2">
            <div className="text-sm font-medium text-ink-700">Agregar producto</div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={itemRow.productoId} onChange={(e) => setItemRow({ ...itemRow, productoId: e.target.value })} className="col-span-2">
                <option value="">Seleccionar producto...</option>
                {inventario?.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>)}
              </Select>
              <Input label="Cantidad" type="number" step="0.1" value={itemRow.cantidadSolicitada} onChange={(e) => setItemRow({ ...itemRow, cantidadSolicitada: Number(e.target.value) })} />
              <Input label="Costo unitario" type="number" step="0.01" value={itemRow.costoUnitario} onChange={(e) => setItemRow({ ...itemRow, costoUnitario: Number(e.target.value) })} />
            </div>
            <Button size="sm" variant="secondary" className="w-full" onClick={agregarItem}><PackagePlus size={14} /> Agregar</Button>
            {form.items.length > 0 && (
              <div className="space-y-1.5 mt-1">
                {form.items.map((i, idx) => {
                  const p = inventario?.find((x) => x.id === i.productoId);
                  return (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-1.5 text-sm">
                      <span className="font-medium">{p?.nombre}</span>
                      <span className="text-ink-500">{i.cantidadSolicitada} x {moneda(i.costoUnitario)}</span>
                      <button className="text-red-400 hover:text-red-600" onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, x) => x !== idx) }))}><X size={14} /></button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl bg-ink-50 px-3 py-2">
            <span className="text-sm font-medium text-ink-600">Total estimado</span>
            <span className="font-bold text-brand-700">{moneda(totalNueva)}</span>
          </div>

          {crear.isError && <div className="text-xs text-red-600">{crear.error?.response?.data?.error}</div>}
          <Button className="w-full" disabled={!form.proveedorId || form.items.length === 0} onClick={() => crear.mutate(form)}>
            {crear.isPending ? 'Creando...' : 'Crear orden de compra'}
          </Button>
        </div>
      </Modal>

      <Modal open={!!recepcion} onClose={() => setRecepcion(null)} title={`Recepcionar ${recepcion?.numero}`} width="max-w-2xl">
        <div className="space-y-3">
          {recepcion?.items.map((i) => {
            const r = recForm[i.id] || {};
            return (
              <div key={i.id} className="rounded-xl border border-ink-100 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{i.producto.nombre}</span>
                  <span className="text-xs text-ink-400">solicitado: {i.cantidadSolicitada} · costo {moneda(i.costoUnitario)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Input label="Cantidad recibida" type="number" step="0.1" value={r.cantidadRecibida ?? 0} onChange={(e) => setRecForm((f) => ({ ...f, [i.id]: { ...f[i.id], cantidadRecibida: Number(e.target.value) } }))} />
                  <Input label="Costo unitario" type="number" step="0.01" value={r.costoUnitario ?? 0} onChange={(e) => setRecForm((f) => ({ ...f, [i.id]: { ...f[i.id], costoUnitario: Number(e.target.value) } }))} />
                  <Input label="Vencimiento" type="date" value={r.fechaVencimiento || ''} onChange={(e) => setRecForm((f) => ({ ...f, [i.id]: { ...f[i.id], fechaVencimiento: e.target.value } }))} />
                </div>
              </div>
            );
          })}
          {recibir.isError && <div className="text-xs text-red-600">{recibir.error?.response?.data?.error}</div>}
          <Button className="w-full" disabled={!recepcion?.items?.length} onClick={() => recibir.mutate({
            id: recepcion.id,
            body: { recepciones: Object.entries(recForm).map(([itemId, v]) => ({ itemId, cantidadRecibida: v.cantidadRecibida, fechaVencimiento: v.fechaVencimiento || undefined, costoUnitario: v.costoUnitario })) },
          })}>
            <CalendarClock size={16} /> {recibir.isPending ? 'Recepcionando...' : 'Confirmar recepción'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
