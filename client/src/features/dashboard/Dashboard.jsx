import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Receipt, Bell, Package, ChefHat, Clock, AlertTriangle, Plus, BarChart3, Store, ArrowRight } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card, StatCard, Empty, Badge, PageHeader, SkeletonTable, Button } from '../../components/ui.jsx';
import { moneda, badgePedido } from '../../lib/format.js';
import { useAuth } from '../../store/auth.js';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const COLORS = ['#f97316', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { has } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/dashboard') });

  if (isLoading) return <SkeletonTable rows={8} />;
  if (!data) return <Empty icon={<Receipt size={22} />} text="No hay información del dashboard" />;

  const pedidosEnFlujo = data.pedidosPorEstado || [];
  const grafico = (data.topProductos || []).map((p) => ({ name: p.producto.nombre, cantidad: p.cantidad }));

  const accesos = [
    has('pedidos.crear') && { label: 'Nuevo pedido', path: '/pedido/nuevo', icon: Plus, color: 'bg-brand-600 text-white hover:bg-brand-700' },
    has('almacen.ver') && { label: 'Almacén', path: '/almacen', icon: Package, color: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50' },
    has('reportes.ver') && { label: 'Reportes', path: '/reportes', icon: BarChart3, color: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50' },
    has('mesas.ver') && { label: 'Mesas', path: '/mesas', icon: Store, color: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50' },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard del restaurante"
        subtitle={`Resumen operativo del día · ${data.pedidosHoy} pedidos`}
        icon={<TrendingUp size={20} />}
        actions={
          accesos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {accesos.map((a) => (
                <Button key={a.label} size="sm" className={a.color} onClick={() => navigate(a.path)}>
                  <a.icon size={14} /> {a.label}
                </Button>
              ))}
            </div>
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Ventas de hoy"
          value={moneda(data.ventasHoy)}
          icon={<TrendingUp size={20} />}
          color="bg-emerald-50 text-emerald-600"
          sub={`${data.pedidosHoy} pedidos vendidos`}
          onClick={has('pedidos.ver') ? () => navigate('/pedidos') : undefined}
        />
        <StatCard
          label="Ticket promedio"
          value={moneda(data.ticketPromedio)}
          icon={<Receipt size={20} />}
          color="bg-brand-50 text-brand-600"
          sub="Promedio por pedido"
        />
        <StatCard
          label="Alertas nuevas"
          value={data.alertasNuevas}
          icon={<Bell size={20} />}
          color={data.alertasNuevas > 0 ? 'bg-red-50 text-red-600' : 'bg-ink-50 text-ink-500'}
          sub={data.alertasNuevas > 0 ? 'Requieren revisión' : 'Sin alertas pendientes'}
          onClick={has('almacen.ver') ? () => navigate('/alertas') : undefined}
        />
        <StatCard
          label="Stock bajo"
          value={data.almacen.stockBajo}
          icon={<Package size={20} />}
          color="bg-amber-50 text-amber-600"
          sub={`${data.almacen.proximosVencer} próximos a vencer · ${data.almacen.vencidos} vencidos`}
          onClick={has('almacen.ver') ? () => navigate('/almacen') : undefined}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Pedidos en operación" subtitle="Flujo actual por estado" icon={<Clock size={15} />} pad={false}>
          {pedidosEnFlujo.length === 0 ? (
            <Empty text="Sin pedidos activos ahora mismo" icon={<Receipt size={20} />} />
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3">
              {pedidosEnFlujo.map((p) => {
                const b = badgePedido(p.estado);
                return (
                  <div key={p.estado} className="flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/40 px-3.5 py-3 hover:border-ink-200 transition">
                    <Badge color={b.color}>{b.label}</Badge>
                    <span className="text-xl font-bold tabular-nums">{p._count._all}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="Productos más vendidos" subtitle="Top 5 del día" icon={<TrendingUp size={15} />} pad={false}>
          {grafico.length === 0 ? (
            <Empty text="Aún no hay ventas hoy" />
          ) : (
            <div className="h-56 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grafico} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={50} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                  <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                    {grafico.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={has('cocina.ver') ? () => navigate('/cocina') : undefined}
          className="flex items-center gap-3 rounded-2xl bg-cyan-50 border border-cyan-100 px-4 py-3.5 text-left hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
        >
          <span className="h-10 w-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center"><ChefHat size={19} /></span>
          <span>
            <span className="block text-sm font-medium text-cyan-800">En preparación</span>
            <span className="block text-2xl font-bold text-cyan-900 tabular-nums">{pedidosEnFlujo.find((p) => p.estado === 'EN_PREPARACION')?._count._all || 0}</span>
          </span>
        </button>
        <button
          onClick={has('pedidos.ver') ? () => navigate('/pedidos') : undefined}
          className="flex items-center gap-3 rounded-2xl bg-green-50 border border-green-100 px-4 py-3.5 text-left hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
        >
          <span className="h-10 w-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center"><Clock size={19} /></span>
          <span>
            <span className="block text-sm font-medium text-green-800">Pedidos listos</span>
            <span className="block text-2xl font-bold text-green-900 tabular-nums">{pedidosEnFlujo.find((p) => p.estado === 'LISTO')?._count._all || 0}</span>
          </span>
        </button>
        <button
          onClick={has('almacen.ver') ? () => navigate('/lotes') : undefined}
          className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3.5 text-left hover:shadow-lift hover:-translate-y-0.5 transition-all duration-200"
        >
          <span className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><AlertTriangle size={19} /></span>
          <span>
            <span className="block text-sm font-medium text-amber-800">Vencidos / por vencer</span>
            <span className="block text-2xl font-bold text-amber-900 tabular-nums">{data.almacen.vencidos} <span className="text-base font-medium text-amber-700">/ {data.almacen.proximosVencer}</span></span>
          </span>
        </button>
      </div>

      {accesos.length > 1 && (
        <div className="flex items-center gap-2 text-xs text-ink-400">
          <ArrowRight size={13} className="text-brand-500" />
          Consejo: usa las teclas <kbd className="px-1 py-px rounded border border-ink-200 bg-white text-[10px]">Ctrl K</kbd> para buscar cualquier sección al instante.
        </div>
      )}
    </div>
  );
}
