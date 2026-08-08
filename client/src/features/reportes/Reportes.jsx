import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Badge, Spinner, Table, Td, StatCard, Empty } from '../../components/ui.jsx';
import { moneda, fecha } from '../../lib/format.js';
import { TrendingUp, ShoppingBag, Receipt, PackageSearch } from 'lucide-react';

const TABS = ['Ventas', 'Más vendidos', 'Consumo', 'Mermas', 'Rotación'];

function rangoDefault() {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  return { desde: desde.toISOString().slice(0, 10), hasta: hasta.toISOString().slice(0, 10) };
}

export default function Reportes() {
  const [tab, setTab] = useState('Ventas');
  const [rango, setRango] = useState(rangoDefault());
  const qs = new URLSearchParams({ desde: rango.desde, hasta: rango.hasta });

  const ventas = useQuery({ queryKey: ['rep-ventas', rango], queryFn: () => api.get(`/reports/ventas?${qs}`) });
  const vendidos = useQuery({ queryKey: ['rep-vendidos', rango], queryFn: () => api.get(`/reports/mas-vendidos?${qs}`) });
  const consumo = useQuery({ queryKey: ['rep-consumo', rango], queryFn: () => api.get(`/reports/consumo?${qs}`) });
  const difs = useQuery({ queryKey: ['rep-diferencias', rango], queryFn: () => api.get(`/reports/consumo/diferencias?${qs}`) });
  const mermas = useQuery({ queryKey: ['rep-mermas', rango], queryFn: () => api.get(`/reports/mermas?${qs}`) });
  const rotacion = useQuery({ queryKey: ['rep-rotacion'], queryFn: () => api.get('/reports/rotacion?dias=30') });

  const loading = tab === 'Ventas' ? ventas.isLoading : tab === 'Más vendidos' ? vendidos.isLoading : tab === 'Consumo' ? consumo.isLoading : tab === 'Mermas' ? mermas.isLoading : rotacion.isLoading;

  const filtros = (
    <div className="flex items-center gap-2">
      <Input type="date" value={rango.desde} onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))} className="w-40" />
      <Input type="date" value={rango.hasta} onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))} className="w-40" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-sm text-ink-500">Análisis de operación, ventas e inventario</p>
        </div>
        {tab !== 'Rotación' && filtros}
      </div>

      <div className="flex gap-2 border-b border-ink-100 overflow-x-auto">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition ${tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-400 hover:text-ink-600'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading && <Spinner />}

      {tab === 'Ventas' && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard label="Ventas totales" value={moneda(ventas.data?.ventasTotales)} icon={<Receipt size={20} />} />
            <StatCard label="Pedidos" value={ventas.data?.totalPedidos} icon={<ShoppingBag size={20} />} color="bg-blue-50 text-blue-600" />
            <StatCard label="Ticket promedio" value={moneda(ventas.data?.ticketPromedio)} icon={<TrendingUp size={20} />} color="bg-emerald-50 text-emerald-600" />
          </div>
          <Card title="Ventas por día" pad={false}>
            <Table headers={['Fecha', 'Total']}>
              {ventas.data?.ventasPorDia.map((d) => (
                <tr key={d.fecha} className="hover:bg-ink-50/50">
                  <Td>{fecha(d.fecha)}</Td>
                  <Td className="font-semibold">{moneda(d.total)}</Td>
                </tr>
              ))}
              {ventas.data?.ventasPorDia.length === 0 && <tr><Td colSpan={2}><Empty text="Sin ventas en el rango" /></Td></tr>}
            </Table>
          </Card>
        </div>
      )}

      {tab === 'Más vendidos' && !loading && (
        <Card title="Ranking de productos" subtitle="Por cantidad vendida" pad={false}>
          <Table headers={['#', 'Producto', 'Cantidad', 'Ingresos']}>
            {vendidos.data?.map((v, i) => (
              <tr key={v.producto.id} className="hover:bg-ink-50/50">
                <Td><Badge color={i === 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-ink-100 text-ink-600 border-ink-200'}>{i + 1}</Badge></Td>
                <Td className="font-medium">{v.producto.nombre}</Td>
                <Td>{v.cantidad}</Td>
                <Td className="font-semibold">{moneda(v.ingresos)}</Td>
              </tr>
            ))}
            {vendidos.data?.length === 0 && <tr><Td colSpan={4}><Empty text="Sin ventas en el rango" /></Td></tr>}
          </Table>
        </Card>
      )}

      {tab === 'Consumo' && !loading && (
        <div className="space-y-4">
          <Card title="Consumo teórico vs real" subtitle="Comparativa por insumo en el período" pad={false}>
            <Table headers={['Insumo', 'Teórico', 'Real', 'Diferencia']}>
              {consumo.data?.map((c) => (
                <tr key={c.producto.id} className="hover:bg-ink-50/50">
                  <Td className="font-medium">{c.producto.nombre}</Td>
                  <Td>{c.teorico} {c.producto.unidad}</Td>
                  <Td>{c.real} {c.producto.unidad}</Td>
                  <Td>
                    <Badge color={Math.abs(c.diferencia) > 5 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                      {c.diferencia > 0 ? '+' : ''}{c.diferencia}
                    </Badge>
                  </Td>
                </tr>
              ))}
              {consumo.data?.length === 0 && <tr><Td colSpan={4}><Empty text="Sin consumo registrado" /></Td></tr>}
            </Table>
          </Card>
          <Card title="Diferencias significativas" subtitle="Posibles fugas o errores de preparación" pad={false}>
            <Table headers={['Insumo', 'Teórico', 'Real', 'Diferencia', '%']}>
              {difs.data?.map((d) => (
                <tr key={d.productoId} className="hover:bg-ink-50/50">
                  <Td className="font-medium">{d.producto?.nombre}</Td>
                  <Td>{d.teorico}</Td>
                  <Td>{d.real}</Td>
                  <Td><span className="font-semibold text-red-600">{d.diferencia}</span></Td>
                  <Td>{d.porcentaje ?? Math.round((d.diferencia / (d.teorico || 1)) * 100)}%</Td>
                </tr>
              ))}
              {difs.data?.length === 0 && <tr><Td colSpan={5}><Empty text="Sin diferencias significativas" /></Td></tr>}
            </Table>
          </Card>
        </div>
      )}

      {tab === 'Mermas' && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard label="Mermas registradas" value={mermas.data?.total} icon={<PackageSearch size={20} />} />
            <StatCard label="Costo total de mermas" value={moneda(mermas.data?.totalCosto)} icon={<Receipt size={20} />} color="bg-red-50 text-red-600" />
          </div>
          <Card title="Detalle de mermas" pad={false}>
            <Table headers={['Fecha', 'Producto', 'Cantidad', 'Tipo', 'Costo', 'Registrado por']}>
              {mermas.data?.mermas.map((m) => (
                <tr key={m.id} className="hover:bg-ink-50/50">
                  <Td className="text-xs text-ink-500">{fecha(m.createdAt)}</Td>
                  <Td className="font-medium">{m.producto.nombre}</Td>
                  <Td><span className="font-semibold text-red-600">-{m.cantidad}</span> {m.producto.unidad}</Td>
                  <Td><Badge color="bg-red-50 text-red-700 border-red-200">{m.tipo}</Badge></Td>
                  <Td>{moneda(m.costo)}</Td>
                  <Td className="text-sm">{m.user?.nombre}</Td>
                </tr>
              ))}
              {mermas.data?.mermas.length === 0 && <tr><Td colSpan={6}><Empty text="Sin mermas en el período" /></Td></tr>}
            </Table>
          </Card>
        </div>
      )}

      {tab === 'Rotación' && !loading && (
        <Card title="Rotación de inventario (30 días)" subtitle="Cobertura estimada por producto" pad={false}>
          <Table headers={['Producto', 'Salidas período', 'Salida diaria', 'Stock actual', 'Días de cobertura']}>
            {rotacion.data?.map((r) => (
              <tr key={r.producto.id} className="hover:bg-ink-50/50">
                <Td className="font-medium">{r.producto.nombre}</Td>
                <Td>{r.salidasPeriodo} {r.producto.unidad}</Td>
                <Td>{r.salidaPromedioDiaria}</Td>
                <Td className="font-semibold">{r.stockActual} {r.producto.unidad}</Td>
                <Td>
                  {r.diasCobertura === null
                    ? <Badge color="bg-ink-100 text-ink-500 border-ink-200">Sin salidas</Badge>
                    : <Badge color={r.diasCobertura < 7 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>{r.diasCobertura} días</Badge>}
                </Td>
              </tr>
            ))}
            {rotacion.data?.length === 0 && <tr><Td colSpan={5}><Empty text="Sin datos" /></Td></tr>}
          </Table>
        </Card>
      )}
    </div>
  );
}
