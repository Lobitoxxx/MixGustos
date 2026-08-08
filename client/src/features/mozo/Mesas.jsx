import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Spinner, Empty, Badge, PageHeader, Info } from '../../components/ui.jsx';
import { badgePedido, moneda, TIPOS_PEDIDO } from '../../lib/format.js';
import { Armchair, Plus, CircleCheck, CircleDot, CircleSlash } from 'lucide-react';

export default function Mesas() {
  const navigate = useNavigate();
  const { data: mesas, isLoading } = useQuery({ queryKey: ['mesas'], queryFn: () => api.get('/tables') });

  if (isLoading) return <Spinner text="Cargando salón..." />;
  if (!mesas) return <Empty icon={<Armchair size={20} />} text="No se pudieron cargar las mesas" />;

  const libres = mesas.filter((m) => m.estado === 'LIBRE').length;
  const ocupadas = mesas.filter((m) => m.estado === 'OCUPADA').length;
  const reservadas = mesas.filter((m) => m.estado === 'RESERVADA').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salón"
        subtitle="Selecciona una mesa para gestionar su pedido"
        icon={<Armchair size={20} />}
        actions={
          <div className="flex items-center gap-2 text-xs">
            <Badge color="bg-emerald-50 text-emerald-700 border-emerald-200" dot="bg-emerald-500"><CircleCheck size={11} /> {libres} libres</Badge>
            <Badge color="bg-brand-50 text-brand-700 border-brand-200" dot="bg-brand-500"><CircleDot size={11} /> {ocupadas} ocupadas</Badge>
            <Badge color="bg-ink-100 text-ink-600 border-ink-200" dot="bg-ink-400"><CircleSlash size={11} /> {reservadas} reservadas</Badge>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {mesas.map((mesa) => {
          const activo = mesa.pedidos?.[0];
          const esLibre = mesa.estado === 'LIBRE';
          return (
            <button
              key={mesa.id}
              onClick={() => (esLibre ? navigate(`/pedido/nuevo/${mesa.id}`) : navigate('/pedidos'))}
              className={`group relative rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lift ${
                esLibre
                  ? 'bg-white border-ink-100 hover:border-brand-300'
                  : mesa.estado === 'OCUPADA'
                  ? 'bg-brand-50/60 border-brand-200 hover:border-brand-400'
                  : 'bg-ink-100/60 border-ink-200'
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${
                esLibre ? 'bg-emerald-400' : mesa.estado === 'OCUPADA' ? 'bg-brand-500' : 'bg-ink-300'
              }" />
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-ink-900">{mesa.nombre}</span>
                <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  esLibre ? 'bg-emerald-50 text-emerald-500' : mesa.estado === 'OCUPADA' ? 'bg-brand-100 text-brand-600' : 'bg-ink-200 text-ink-500'
                }`}>
                  <Armchair size={16} />
                </span>
              </div>
              <div className="flex items-center justify-between">
                <Badge
                  color={esLibre ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : mesa.estado === 'OCUPADA' ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-ink-100 text-ink-600 border-ink-200'}
                >
                  {esLibre ? 'Libre' : mesa.estado === 'OCUPADA' ? 'Ocupada' : 'Reservada'}
                </Badge>
                <span className="text-xs text-ink-400">cap. {mesa.capacidad}</span>
              </div>

              {activo ? (
                <div className="mt-3 pt-3 border-t border-brand-100">
                  <div className="flex items-center gap-1.5 text-xs text-ink-500">
                    {TIPOS_PEDIDO[activo.tipo]?.emoji} <span className="font-mono font-semibold">{activo.codigo}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <Badge color={badgePedido(activo.estado).color}>{badgePedido(activo.estado).label}</Badge>
                    <span className="text-sm font-bold text-ink-900 tabular-nums">{moneda(activo.total)}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-center gap-1 text-xs text-brand-600 font-medium opacity-80 group-hover:opacity-100 transition">
                  <Plus size={14} /> Registrar pedido
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Info>Al hacer clic en una mesa ocupada verás sus pedidos activos. En una mesa libre puedes registrar un pedido al instante. El estado de cada mesa se actualiza en tiempo real.</Info>
      </div>
    </div>
  );
}
