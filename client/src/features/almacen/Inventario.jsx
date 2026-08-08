import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Badge, Modal, SkeletonTable, Table, Td, Select, PageHeader, SearchInput, ProgressBar, Tooltip } from '../../components/ui.jsx';
import { moneda, fecha } from '../../lib/format.js';
import { useToast } from '../../components/ui.jsx';
import { ArrowDownCircle, ArrowUpCircle, Package, PackageX } from 'lucide-react';

export default function Inventario() {
  const qc = useQueryClient();
  const toast = useToast();
  const { data, isLoading } = useQuery({ queryKey: ['inventario'], queryFn: () => api.get('/warehouse/inventory') });
  const [modal, setModal] = useState(null);
  const [cantidad, setCantidad] = useState(0);
  const [motivo, setMotivo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const mover = useMutation({
    mutationFn: ({ tipo, body }) => api.post(`/warehouse/${tipo}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventario'] });
      qc.invalidateQueries({ queryKey: ['alertas'] });
      setModal(null);
      toast.success(modal?.tipo === 'entrada' ? 'Entrada registrada' : 'Salida registrada');
    },
    onError: (err) => toast.error('No se pudo registrar el movimiento', err.response?.data?.error),
  });

  if (isLoading) return <SkeletonTable rows={8} />;

  const filtrados = (data || []).filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const bajo = (data || []).filter((p) => p.stockMinimo > 0 && p.stock <= p.stockMinimo);
  const agotados = (data || []).filter((p) => p.stock <= 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Inventario / Stock"
        subtitle={`${bajo.length} productos bajo el mínimo · ${agotados.length} agotados`}
        icon={<Package size={20} />}
        actions={
          <SearchInput value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar producto..." className="w-64" />
        }
      />

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge color={agotados.length > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} dot={agotados.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}>
          {agotados.length} agotados
        </Badge>
        <Badge color={bajo.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'} dot={bajo.length > 0 ? 'bg-amber-500' : 'bg-emerald-500'}>
          {bajo.length} bajo mínimo
        </Badge>
        <Badge color="bg-ink-50 text-ink-600 border-ink-200">
          {filtrados.length} productos
        </Badge>
      </div>

      <Card pad={false}>
        <Table headers={['Producto', 'Categoría', 'Unidad', 'Stock', 'Mínimo', 'Nivel', 'Lotes activos', 'Costo', 'Acciones']}>
          {filtrados.map((p) => {
            const esBajo = p.stockMinimo > 0 && p.stock <= p.stockMinimo;
            const esAgotado = p.stock <= 0;
            const nivelMax = Math.max(p.stockMinimo * 3, 1);
            return (
              <tr key={p.id} className="group hover:bg-ink-50/50 transition-colors">
                <Td className="font-medium text-ink-900">
                  <div className="flex items-center gap-2">
                    {esAgotado && <PackageX size={14} className="text-red-500 shrink-0" />}
                    {p.nombre}
                  </div>
                </Td>
                <Td className="text-ink-500">{p.categoria?.nombre}</Td>
                <Td className="text-ink-500">{p.unidad}</Td>
                <Td>
                  <span className={`font-bold tabular-nums ${esAgotado ? 'text-red-600' : esBajo ? 'text-amber-600' : ''}`}>{p.stock}</span>
                  {esBajo && <Badge className="ml-1" color="bg-red-50 text-red-700 border-red-200">bajo</Badge>}
                </Td>
                <Td className="tabular-nums">{p.stockMinimo}</Td>
                <Td className="min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <ProgressBar value={p.stock} max={nivelMax} className="w-20" />
                    <Tooltip label={`${p.stock} de ${nivelMax} unidades objetivo`}>
                      <span className={`text-[10px] font-semibold ${esAgotado ? 'text-red-500' : esBajo ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {p.stockMinimo > 0 && p.stock > p.stockMinimo ? 'OK' : ''}
                      </span>
                    </Tooltip>
                  </div>
                </Td>
                <Td>
                  <div className="space-y-0.5 max-w-[240px]">
                    {p.lotes.filter((l) => l.cantidadActual > 0).length === 0 ? (
                      <span className="text-xs text-ink-400">—</span>
                    ) : (
                      p.lotes.filter((l) => l.cantidadActual > 0).map((l) => (
                        <div key={l.id} className="text-xs flex justify-between border-b border-ink-50 pb-0.5">
                          <span className="font-mono text-ink-500">{l.codigo}</span>
                          <span>{l.cantidadActual} <span className="text-ink-400">· vence {l.fechaVencimiento ? fecha(l.fechaVencimiento) : '—'}</span></span>
                        </div>
                      ))
                    )}
                  </div>
                </Td>
                <Td className="tabular-nums">{moneda(p.costo)}</Td>
                <Td>
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => { setModal({ tipo: 'entrada', producto: p }); setCantidad(0); setMotivo(''); }}>
                      <ArrowUpCircle size={14} className="text-emerald-600" /> Entrada
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setModal({ tipo: 'salida', producto: p }); setCantidad(0); setMotivo(''); }}>
                      <ArrowDownCircle size={14} className="text-red-600" /> Salida
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </Table>
      </Card>

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={`${modal?.tipo === 'entrada' ? 'Registrar entrada' : 'Registrar salida'}`}
        subtitle={modal?.producto?.nombre}
      >
        <div className="space-y-3">
          <Input
            label="Cantidad"
            type="number"
            step="0.1"
            min="0"
            value={cantidad}
            onChange={(e) => setCantidad(Number(e.target.value))}
            autoFocus
          />
          <Input
            label="Motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={modal?.tipo === 'entrada' ? 'Ej: Compra, devolución...' : 'Ej: Consumo, merma, uso...'}
          />
          <div className="rounded-xl bg-ink-50 px-3 py-2 text-xs text-ink-500">
            Producto: <b>{modal?.producto?.nombre}</b> · Stock actual: <b>{modal?.producto?.stock}</b> {modal?.producto?.unidad}
          </div>
          {mover.isError && <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{mover.error?.response?.data?.error}</div>}
          <Button className="w-full" loading={mover.isPending} disabled={cantidad <= 0 || !motivo.trim()} onClick={() => mover.mutate({ tipo: modal.tipo, body: { productoId: modal.producto.id, cantidad, motivo } })}>
            {modal?.tipo === 'entrada' ? 'Confirmar entrada' : 'Confirmar salida'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
