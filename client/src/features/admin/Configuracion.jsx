import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Select, Spinner, Badge } from '../../components/ui.jsx';
import { Save } from 'lucide-react';

export default function Configuracion() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => api.get('/settings') });
  const [form, setForm] = useState(null);

  const guardar = useMutation({
    mutationFn: (body) => api.put('/settings', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['alertas'] });
    },
  });

  if (isLoading) return <Spinner />;
  if (!form && data) setForm({ ...data });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Configuración del sistema</h1>
        <p className="text-sm text-ink-500">Datos del restaurante y parámetros operativos</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card title="Datos del restaurante" className="xl:col-span-2">
          <div className="space-y-3">
            <Input label="Nombre del restaurante" value={form?.nombreRestaurante || ''} onChange={(e) => setForm({ ...form, nombreRestaurante: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="RUC" value={form?.ruc || ''} onChange={(e) => setForm({ ...form, ruc: e.target.value })} />
              <Input label="Teléfono" value={form?.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <Input label="Dirección" value={form?.direccion || ''} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
            <Input label="Horario de atención" value={form?.horarioAtencion || ''} onChange={(e) => setForm({ ...form, horarioAtencion: e.target.value })} placeholder="Ej: Lun-Dom 12:00 - 22:00" />
          </div>
        </Card>

        <Card title="Parámetros" subtitle="Control de operación e inventario">
          <div className="space-y-3">
            <Select label="Moneda" value={form?.moneda || 'S/'} onChange={(e) => setForm({ ...form, moneda: e.target.value })}>
              <option value="S/">Soles (S/)</option>
              <option value="$">Dólares ($)</option>
            </Select>
            <Select label="Método de inventario" value={form?.metodoInventario || 'FEFO'} onChange={(e) => setForm({ ...form, metodoInventario: e.target.value })}>
              <option value="FEFO">FEFO (primero vence, primero sale)</option>
              <option value="PEPS">PEPS (primero entra, primero sale)</option>
            </Select>
            <div className="grid grid-cols-2 gap-3">
              <Input label="IGV (%)" type="number" step="0.1" value={form?.igv ?? 18} onChange={(e) => setForm({ ...form, igv: Number(e.target.value) })} />
              <Input label="Días próximos a vencer" type="number" value={form?.diasProximosVencer ?? 7} onChange={(e) => setForm({ ...form, diasProximosVencer: Number(e.target.value) })} />
            </div>
            <Input label="Umbral de diferencia consumo (%)" type="number" step="1" value={form?.umbralDiferencia ?? 5} onChange={(e) => setForm({ ...form, umbralDiferencia: Number(e.target.value) })} />
            <Input label="Política FEFO" value={form?.politicaFEFO || ''} onChange={(e) => setForm({ ...form, politicaFEFO: e.target.value })} />
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        {guardar.isSuccess && <Badge color="bg-emerald-50 text-emerald-700 border-emerald-200">Configuración guardada</Badge>}
        {guardar.isError && <Badge color="bg-red-50 text-red-700 border-red-200">{guardar.error?.response?.data?.error}</Badge>}
        <Button className="ml-auto" disabled={guardar.isPending} onClick={() => guardar.mutate(form)}>
          <Save size={15} /> {guardar.isPending ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>
    </div>
  );
}
