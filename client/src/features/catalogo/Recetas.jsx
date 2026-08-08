import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Select, Modal, Spinner, Empty, Table, Td, Badge } from '../../components/ui.jsx';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Recetas() {
  const qc = useQueryClient();
  const { data: recetas, isLoading } = useQuery({ queryKey: ['recetas'], queryFn: () => api.get('/catalog/recipes') });
  const { data: productos } = useQuery({ queryKey: ['productos'], queryFn: () => api.get('/catalog/products') });

  const [modal, setModal] = useState(false);
  const [platoId, setPlatoId] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const vendibles = (productos || []).filter((p) => p.esVendible);
  const insumos = (productos || []).filter((p) => !p.esVendible);

  const guardar = useMutation({
    mutationFn: (body) => api.post('/catalog/recipes', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recetas'] });
      qc.invalidateQueries({ queryKey: ['productos'] });
      setModal(false);
    },
  });
  const eliminar = useMutation({
    mutationFn: (id) => api.delete(`/catalog/recipes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recetas'] }),
  });

  useEffect(() => {
    if (modal && editing) {
      setPlatoId(editing.productoId);
      setDescripcion(editing.descripcion || '');
      setItems(editing.items.map((i) => ({ ingredienteId: i.ingredienteId, cantidad: i.cantidad })));
    }
  }, [modal, editing]);

  function abrirNueva() {
    setEditing(null);
    setPlatoId('');
    setDescripcion('');
    setItems([]);
    setModal(true);
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recetas</h1>
          <p className="text-sm text-ink-500">Ingredientes por plato — conecta ventas con inventario</p>
        </div>
        <Button onClick={abrirNueva}><Plus size={16} /> Nueva receta</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {recetas?.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{r.producto.nombre}</h3>
                <div className="text-xs text-ink-400">{r.descripcion || 'Sin descripción'}</div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setModal(true); }}><Pencil size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(r.id)}><Trash2 size={14} className="text-red-500" /></Button>
              </div>
            </div>
            <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3">
              {r.items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span>{i.ingrediente.nombre}</span>
                  <span className="font-medium">{i.cantidad} {i.ingrediente.unidad}</span>
                </div>
              ))}
              {r.items.length === 0 && <Empty text="Sin ingredientes" />}
            </div>
          </Card>
        ))}
        {recetas?.length === 0 && <Empty text="No hay recetas registradas" />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Editar receta de ${editing.producto.nombre}` : 'Nueva receta'} width="max-w-2xl">
        <div className="space-y-3">
          <Select label="Plato" value={platoId} onChange={(e) => setPlatoId(e.target.value)}>
            <option value="">Seleccionar plato...</option>
            {vendibles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Select>
          <Input label="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-ink-700">Ingredientes</span>
              <Button size="sm" variant="secondary" onClick={() => setItems((i) => [...i, { ingredienteId: '', cantidad: 0 }])}><Plus size={13} /> Agregar</Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2">
                  <Select value={item.ingredienteId} onChange={(e) => setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, ingredienteId: e.target.value } : x)))} className="flex-1">
                    <option value="">Ingrediente...</option>
                    {insumos.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({p.unidad})</option>)}
                  </Select>
                  <Input type="number" step="0.1" value={item.cantidad} onChange={(e) => setItems((arr) => arr.map((x, i) => (i === idx ? { ...x, cantidad: Number(e.target.value) } : x)))} className="w-24" />
                  <Button size="sm" variant="ghost" onClick={() => setItems((arr) => arr.filter((_, i) => i !== idx))}><Trash2 size={14} className="text-red-500" /></Button>
                </div>
              ))}
            </div>
          </div>

          {guardar.isError && <div className="text-xs text-red-600">{guardar.error?.response?.data?.error}</div>}
          <Button
            className="w-full"
            disabled={!platoId || items.length === 0 || items.some((i) => !i.ingredienteId || i.cantidad <= 0)}
            onClick={() => guardar.mutate({ productoId: platoId, descripcion, rendimiento: 1, items })}
          >
            {guardar.isPending ? 'Guardando...' : 'Guardar receta'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
