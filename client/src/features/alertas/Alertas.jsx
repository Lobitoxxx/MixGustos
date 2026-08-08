import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Button, Badge, Select, Empty, PageHeader, SegmentedControl } from '../../components/ui.jsx';
import { fechaHora } from '../../lib/format.js';
import { useToast } from '../../components/ui.jsx';
import { RefreshCw, CheckCheck, Bell, CalendarX2, Hourglass, TrendingDown, PackagePlus, ScanSearch } from 'lucide-react';

const TIPO_META = {
  VENCIDO: { label: 'Vencido', color: 'bg-red-50 text-red-700 border-red-200', bar: '#ef4444', icon: CalendarX2, severidad: 3 },
  PROXIMO_VENCER: { label: 'Próximo a vencer', color: 'bg-orange-50 text-orange-700 border-orange-200', bar: '#f97316', icon: Hourglass, severidad: 2 },
  STOCK_MINIMO: { label: 'Stock mínimo', color: 'bg-amber-50 text-amber-700 border-amber-200', bar: '#f59e0b', icon: TrendingDown, severidad: 2 },
  REPOSICION: { label: 'Reposición', color: 'bg-blue-50 text-blue-700 border-blue-200', bar: '#3b82f6', icon: PackagePlus, severidad: 1 },
  DIFERENCIA_CONSUMO: { label: 'Diferencia de consumo', color: 'bg-purple-50 text-purple-700 border-purple-200', bar: '#8b5cf6', icon: ScanSearch, severidad: 1 },
};
const ESTADO_COLOR = {
  NUEVA: 'bg-red-50 text-red-700 border-red-200',
  VISTA: 'bg-sky-50 text-sky-700 border-sky-200',
  RESUELTA: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function Alertas() {
  const qc = useQueryClient();
  const toast = useToast();
  const [estado, setEstado] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['alertas', estado],
    queryFn: () => api.get(`/alerts${estado ? `?estado=${estado}` : ''}`),
  });

  const marcar = useMutation({
    mutationFn: ({ id, estado }) => api.patch(`/alerts/${id}`, { estado }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alertas'] }),
  });
  const check = useMutation({
    mutationFn: () => api.post('/alerts/check'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alertas'] });
      toast.success('Revisión completada');
    },
  });

  const list = data || [];
  const nuevas = list.filter((a) => a.estado === 'NUEVA').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alertas"
        subtitle={`${nuevas} pendientes de revisión · ${list.length} en total`}
        icon={<Bell size={20} />}
        actions={
          <>
            <SegmentedControl
              value={estado}
              onChange={setEstado}
              options={[
                { value: '', label: 'Todas' },
                { value: 'NUEVA', label: 'Nuevas' },
                { value: 'VISTA', label: 'Vistas' },
                { value: 'RESUELTA', label: 'Resueltas' },
              ]}
            />
            <Button variant="secondary" onClick={() => check.mutate()} loading={check.isPending} icon={<RefreshCw size={15} />}>
              Revisar
            </Button>
            <Button
              onClick={() => list.filter((a) => a.estado === 'NUEVA').forEach((a) => marcar.mutate({ id: a.id, estado: 'VISTA' }))}
              disabled={nuevas === 0}
              icon={<CheckCheck size={15} />}
            >
              Marcar vistas
            </Button>
          </>
        }
      />

      <div className="space-y-2.5">
        {list.length === 0 && <Empty text="No hay alertas por aquí" icon={<Bell size={20} />} />}
        {list.map((a) => {
          const t = TIPO_META[a.tipo] || { label: a.tipo, color: 'bg-ink-100 text-ink-600 border-ink-200', bar: '#94a3b8', icon: Bell, severidad: 0 };
          const Icon = t.icon;
          return (
            <div
              key={a.id}
              className={`group flex items-start justify-between gap-4 rounded-2xl bg-white border border-ink-100 shadow-card p-4 transition-all duration-200 hover:shadow-lift hover:-translate-y-0.5 ${
                a.estado === 'NUEVA' ? 'border-l-4' : ''
              }`}
              style={a.estado === 'NUEVA' ? { borderLeftColor: t.bar } : undefined}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <span className={`h-10 w-10 rounded-xl ${t.color.split(' ')[0]} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={t.color.split(' ')[1]} />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-ink-900">{a.titulo}</span>
                    <Badge color={t.color}>{t.label}</Badge>
                    {a.estado === 'NUEVA' && <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                  </div>
                  <div className="text-sm text-ink-500 mt-0.5">{a.mensaje}</div>
                  <div className="text-xs text-ink-400 mt-1.5">
                    {fechaHora(a.createdAt)}{a.producto ? ` · ${a.producto.nombre}` : ''}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge color={ESTADO_COLOR[a.estado]}>{a.estado === 'NUEVA' ? 'Nueva' : a.estado === 'VISTA' ? 'Vista' : 'Resuelta'}</Badge>
                {a.estado !== 'RESUELTA' && (
                  <Button size="sm" variant="secondary" onClick={() => marcar.mutate({ id: a.id, estado: 'RESUELTA' })}>
                    Resolver
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
