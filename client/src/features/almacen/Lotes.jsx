import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Select, Modal, Badge, Spinner, Table, Td } from '../../components/ui.jsx';
import { fecha, fechaHora } from '../../lib/format.js';
import { Plus, GitCompareArrows } from 'lucide-react';

export default function Lotes() {
  const qc = useQueryClient();
  const { data: lotes, isLoading } = useQuery({ queryKey: ['lotes'], queryFn: () => api.get('/warehouse/lots') });
  const { data: inventario } = useQuery({ queryKey: ['inventario'], queryFn: () => api.get('/warehouse/inventory') });
  const { data: prox } = useQuery({ queryKey: ['proximos'], queryFn: () => api.get('/warehouse/proximos-vencer') });

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productoId: '', cantidad: 0, fechaIngreso: '', fechaVencimiento: '', costoUnitario: 0 });
  const [comp, setComp] = useState(null);

  const crear = useMutation({
    mutationFn: (body) => api.post('/warehouse/lots', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes'] });
      qc.invalidateQueries({ queryKey: ['inventario'] });
      setModal(false);
    },
  });

  const { data: compFefo } = useQuery({
    queryKey: ['fefo', comp?.productoId],
    queryFn: () => api.get(`/warehouse/lots/fefo?productoId=${comp.productoId}`),
    enabled: !!comp?.productoId && comp?.metodo === 'FEFO',
  });
  const { data: compPeps } = useQuery({
    queryKey: ['peps', comp?.productoId],
    queryFn: () => api.get(`/warehouse/lots/peps?productoId=${comp.productoId}`),
    enabled: !!comp?.productoId && comp?.metodo === 'PEPS',
  });

  const dataComp = comp?.metodo === 'FEFO' ? compFefo : compPeps;

  if (isLoading) return <Spinner />;

  const hoy = new Date();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Lotes · FEFO / PEPS</h1>
          <p className="text-sm text-ink-500">Control de lotes, vencimientos y metodología de salida</p>
        </div>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Nuevo lote</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card title="Comparador FEFO vs PEPS" subtitle="Simula el orden de salida de un producto" className="xl:col-span-1">
          <div className="space-y-3">
            <Select
              value={comp?.productoId || ''}
              onChange={(e) => {
                const p = inventario?.find((x) => x.id === e.target.value);
                setComp(p ? { productoId: p.id, producto: p, metodo: p.esPerecedero === false ? 'PEPS' : 'FEFO' } : null);
              }}
            >
              <option value="">Seleccionar producto...</option>
              {inventario?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
            {comp && (
              <div>
                <div className="text-xs text-ink-500 mb-1">Método aplicado: <Badge color={comp.metodo === 'FEFO' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-blue-50 text-blue-700 border-blue-200'}>{comp.metodo} {comp.producto.esPerecedero === false ? '(no perecedero)' : ''}</Badge></div>
                {!dataComp ? (
                  <Spinner />
                ) : (
                  <div className="space-y-1.5 mt-2">
                    {dataComp.lotes.filter((l) => l.cantidadActual > 0).map((l, idx) => (
                      <div key={l.id} className="flex items-center justify-between text-sm rounded-lg border border-ink-100 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-ink-400 font-mono text-xs">#{idx + 1}</span>
                          <GitCompareArrows size={14} className="text-brand-500" />
                          <span className="font-mono font-medium">{l.codigo}</span>
                        </div>
                        <div className="text-xs text-ink-500">
                          {comp.metodo === 'FEFO' ? `vence ${l.fechaVencimiento ? fecha(l.fechaVencimiento) : '—'}` : `ingresó ${fecha(l.fechaIngreso)}`}
                        </div>
                        <Badge color="bg-ink-100 text-ink-700 border-ink-200">{l.cantidadActual}</Badge>
                      </div>
                    ))}
                    <p className="text-[11px] text-ink-400 pt-1">
                      FEFO = primero el que vence antes (prioritario en perecederos) · PEPS = primero el que entró antes
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card title="Próximos a vencer" subtitle="Acción recomendada antes de pérdidas" className="xl:col-span-2">
          {prox?.length === 0 ? (
            <div className="text-sm text-emerald-600">Sin lotes próximos a vencer</div>
          ) : (
            <Table headers={['Lote', 'Producto', 'Cantidad', 'Ingreso', 'Vencimiento', 'Estado']}>
              {prox?.map((l) => {
                const dias = Math.ceil((new Date(l.fechaVencimiento) - hoy) / 86400000);
                return (
                  <tr key={l.id}>
                    <Td className="font-mono">{l.codigo}</Td>
                    <Td className="font-medium">{l.producto.nombre}</Td>
                    <Td>{l.cantidadActual} {l.producto.unidad}</Td>
                    <Td>{fecha(l.fechaIngreso)}</Td>
                    <Td className="font-medium">{fecha(l.fechaVencimiento)}</Td>
                    <Td>
                      <Badge color={dias < 0 ? 'bg-red-50 text-red-700 border-red-200' : dias <= 3 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-orange-50 text-orange-700 border-orange-200'}>
                        {dias < 0 ? 'Vencido' : `${dias} día(s)`}
                      </Badge>
                    </Td>
                  </tr>
                );
              })}
            </Table>
          )}
        </Card>
      </div>

      <Card title="Todos los lotes" pad={false}>
        <Table headers={['Código', 'Producto', 'Inicial', 'Actual', 'Ingreso', 'Vencimiento', 'Costo unit.', 'Estado', 'Creado']}>
          {lotes?.map((l) => (
            <tr key={l.id} className="hover:bg-ink-50/50">
              <Td className="font-mono">{l.codigo}</Td>
              <Td className="font-medium">{l.producto.nombre}</Td>
              <Td>{l.cantidadInicial}</Td>
              <Td className="font-semibold">{l.cantidadActual}</Td>
              <Td>{fecha(l.fechaIngreso)}</Td>
              <Td>{l.fechaVencimiento ? fecha(l.fechaVencimiento) : '—'}</Td>
              <Td>{l.costoUnitario}</Td>
              <Td>
                <Badge color={l.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : l.estado === 'VENCIDO' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-ink-100 text-ink-600 border-ink-200'}>
                  {l.estado}
                </Badge>
              </Td>
              <Td className="text-xs text-ink-400">{fechaHora(l.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Nuevo lote">
        <div className="space-y-3">
          <Select label="Producto" value={form.productoId} onChange={(e) => setForm({ ...form, productoId: e.target.value })}>
            <option value="">Seleccionar...</option>
            {inventario?.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
          <Input label="Cantidad" type="number" step="0.1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha ingreso" type="date" value={form.fechaIngreso} onChange={(e) => setForm({ ...form, fechaIngreso: e.target.value })} />
            <Input label="Fecha vencimiento" type="date" value={form.fechaVencimiento} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })} />
          </div>
          <Input label="Costo unitario" type="number" step="0.01" value={form.costoUnitario} onChange={(e) => setForm({ ...form, costoUnitario: Number(e.target.value) })} />
          {crear.isError && <div className="text-xs text-red-600">{crear.error?.response?.data?.error}</div>}
          <Button className="w-full" disabled={!form.productoId || form.cantidad <= 0} onClick={() => crear.mutate(form)}>
            {crear.isPending ? 'Creando...' : 'Crear lote'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
