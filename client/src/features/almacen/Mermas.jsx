import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Select, Badge, Spinner, Table, Td } from '../../components/ui.jsx';
import { fechaHora, moneda } from '../../lib/format.js';
import { PackageX, RotateCcw } from 'lucide-react';

const TIPOS_MERMA = [
  { valor: 'VENCIDO', label: 'Vencido' },
  { valor: 'DANADO', label: 'Dañado' },
  { valor: 'DESPERDICIADO', label: 'Desperdiciado' },
  { valor: 'ERROR_PREPARACION', label: 'Error de preparación' },
  { valor: 'OTRO', label: 'Otro' },
];

export default function Mermas() {
  const qc = useQueryClient();
  const { data: inventario, isLoading } = useQuery({ queryKey: ['inventario'], queryFn: () => api.get('/warehouse/inventory') });
  const { data: vencidos } = useQuery({ queryKey: ['vencidos'], queryFn: () => api.get('/warehouse/vencidos') });
  const { data: movs } = useQuery({ queryKey: ['movimientos'], queryFn: () => api.get('/warehouse/movements') });

  const [form, setForm] = useState({ productoId: '', cantidad: 0, tipo: 'VENCIDO', motivo: '', lotId: '' });

  const registrar = useMutation({
    mutationFn: (body) => api.post('/warehouse/mermas', body),
    onSuccess: () => {
      ['inventario', 'vencidos', 'movimientos', 'alertas'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
      setForm({ productoId: '', cantidad: 0, tipo: 'VENCIDO', motivo: '', lotId: '' });
    },
  });

  const producto = inventario?.find((p) => p.id === form.productoId);
  const lotesActivos = producto?.lotes.filter((l) => l.cantidadActual > 0) || [];
  const mermas = (movs || []).filter((m) => m.tipo === 'MERMA');

  if (isLoading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="space-y-6">
        <Card title="Registrar merma" subtitle="Baja de stock por vencimiento, daño o error">
          <div className="space-y-3">
            <Select label="Producto" value={form.productoId} onChange={(e) => setForm({ ...form, productoId: e.target.value, lotId: '' })}>
              <option value="">Seleccionar...</option>
              {inventario?.map((p) => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>)}
            </Select>

            {producto && lotesActivos.length > 0 && (
              <Select label="Lote (opcional)" value={form.lotId} onChange={(e) => setForm({ ...form, lotId: e.target.value })}>
                <option value="">Consumir por FEFO/PEPS</option>
                {lotesActivos.map((l) => (
                  <option key={l.id} value={l.id}>{l.codigo} · {l.cantidadActual} · vence {l.fechaVencimiento ? new Date(l.fechaVencimiento).toLocaleDateString('es-PE') : '—'}</option>
                ))}
              </Select>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Cantidad" type="number" step="0.1" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} />
              <Select label="Tipo" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {TIPOS_MERMA.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
              </Select>
            </div>
            <Input label="Motivo / detalle" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} placeholder="Ej: se venció antes de venderse..." />

            {registrar.isError && <div className="text-xs text-red-600">{registrar.error?.response?.data?.error}</div>}
            <Button className="w-full" disabled={!form.productoId || form.cantidad <= 0} onClick={() => registrar.mutate(form)}>
              <PackageX size={16} /> {registrar.isPending ? 'Registrando...' : 'Registrar merma'}
            </Button>
          </div>
        </Card>

        {vencidos?.length > 0 && (
          <Card title={`Lotes vencidos (${vencidos.length})`} subtitle="Requieren merma o revisión">
            <div className="space-y-2">
              {vencidos.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-red-100 bg-red-50/40 px-3 py-2">
                  <div>
                    <div className="text-sm font-medium">{l.producto.nombre}</div>
                    <div className="text-xs text-ink-500 font-mono">{l.codigo} · {l.cantidadActual} {l.producto.unidad}</div>
                  </div>
                  <Badge color="bg-red-50 text-red-700 border-red-200">vencido {new Date(l.fechaVencimiento).toLocaleDateString('es-PE')}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <Card title="Movimientos de merma" subtitle={`${mermas.length} registro(s)`} className="xl:col-span-2" pad={false}>
        <Table headers={['Fecha', 'Producto', 'Cantidad', 'Tipo', 'Motivo', 'Registrado por']}>
          {mermas.map((m) => (
            <tr key={m.id} className="hover:bg-ink-50/50">
              <Td className="text-xs text-ink-500">{fechaHora(m.createdAt)}</Td>
              <Td className="font-medium">{m.producto.nombre}</Td>
              <Td><span className="font-semibold text-red-600">-{m.cantidad}</span> {m.producto.unidad}</Td>
              <Td><Badge color="bg-red-50 text-red-700 border-red-200">{m.merma?.tipo || 'MERMA'}</Badge></Td>
              <Td className="text-sm text-ink-500">{m.motivo || '—'}</Td>
              <Td className="text-sm">{m.user?.nombre}</Td>
            </tr>
          ))}
          {mermas.length === 0 && (
            <tr><Td colSpan={6} className="text-center text-ink-400 py-8">Sin mermas registradas <RotateCcw size={14} className="inline" /></Td></tr>
          )}
        </Table>
      </Card>
    </div>
  );
}
