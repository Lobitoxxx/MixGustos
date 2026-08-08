import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Select, Badge, Modal, Spinner, Empty, Table, Td } from '../../components/ui.jsx';
import { moneda } from '../../lib/format.js';
import { Plus, Pencil } from 'lucide-react';

const vacio = { codigo: '', nombre: '', categoriaId: '', unidad: 'und', stockMinimo: 0, costo: 0, precioVenta: 0, esVendible: true, esPerecedero: true };

export default function Productos() {
  const qc = useQueryClient();
  const { data: products, isLoading } = useQuery({ queryKey: ['productos'], queryFn: () => api.get('/catalog/products') });
  const { data: categorias } = useQuery({ queryKey: ['categorias'], queryFn: () => api.get('/catalog/categories') });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vacio);
  const [editing, setEditing] = useState(null);

  const guardar = useMutation({
    mutationFn: (body) => (editing ? api.put(`/catalog/products/${editing.id}`, body) : api.post('/catalog/products', body)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['productos'] });
      setModal(false);
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Productos</h1>
          <p className="text-sm text-ink-500">{products?.length} productos registrados</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(vacio); setModal(true); }}><Plus size={16} /> Nuevo producto</Button>
      </div>

      <Card pad={false}>
        <Table headers={['Código', 'Nombre', 'Categoría', 'Unidad', 'Stock mín.', 'Costo', 'Precio venta', 'Tipo', 'Estado', '']}>
          {products?.map((p) => (
            <tr key={p.id} className="hover:bg-ink-50/50">
              <Td className="font-mono text-xs">{p.codigo}</Td>
              <Td className="font-medium">{p.nombre}</Td>
              <Td>{p.categoria?.nombre}</Td>
              <Td>{p.unidad}</Td>
              <Td>{p.stockMinimo}</Td>
              <Td>{moneda(p.costo)}</Td>
              <Td className="font-semibold">{moneda(p.precioVenta)}</Td>
              <Td>
                <div className="flex gap-1">
                  {p.esVendible && <Badge color="bg-brand-50 text-brand-700 border-brand-200">vendible</Badge>}
                  {p.esPerecedero ? <Badge color="bg-amber-50 text-amber-700 border-amber-200">perecedero</Badge> : <Badge>no perecedero</Badge>}
                </div>
              </Td>
              <Td>{p.activo ? <Badge color="bg-emerald-50 text-emerald-700 border-emerald-200">activo</Badge> : <Badge color="bg-red-50 text-red-700 border-red-200">inactivo</Badge>}</Td>
              <Td>
                <Button size="sm" variant="ghost" onClick={() => { setEditing(p); setForm(p); setModal(true); }}><Pencil size={14} /></Button>
              </Td>
            </tr>
          ))}
        </Table>
        {products?.length === 0 && <Empty />}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Editar ${editing.nombre}` : 'Nuevo producto'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Código" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Categoría" value={form.categoriaId} onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}>
              <option value="">Seleccionar...</option>
              {categorias?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
            <Select label="Unidad" value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })}>
              {['g', 'ml', 'kg', 'l', 'und', 'doc', 'porción', 'plato', 'vaso'].map((u) => <option key={u} value={u}>{u}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Stock mínimo" type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })} />
            <Input label="Costo" type="number" step="0.01" value={form.costo} onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })} />
            <Input label="Precio venta" type="number" step="0.01" value={form.precioVenta} onChange={(e) => setForm({ ...form, precioVenta: Number(e.target.value) })} />
          </div>
          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.esVendible} onChange={(e) => setForm({ ...form, esVendible: e.target.checked })} className="accent-orange-600" /> Es vendible (plato)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.esPerecedero} onChange={(e) => setForm({ ...form, esPerecedero: e.target.checked })} className="accent-orange-600" /> Perecedero</label>
          </div>
          {guardar.isError && <div className="text-xs text-red-600">{guardar.error?.response?.data?.error}</div>}
          <Button className="w-full" onClick={() => guardar.mutate(form)} disabled={guardar.isPending}>
            {guardar.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
