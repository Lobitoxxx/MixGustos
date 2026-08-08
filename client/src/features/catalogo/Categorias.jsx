import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Modal, Spinner, Table, Td } from '../../components/ui.jsx';
import { Plus, Pencil, Trash2 } from 'lucide-react';

export default function Categorias() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['categorias'], queryFn: () => api.get('/catalog/categories') });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', descripcion: '', orden: 0 });
  const [editing, setEditing] = useState(null);

  const guardar = useMutation({
    mutationFn: (body) => (editing ? api.put(`/catalog/categories/${editing.id}`, body) : api.post('/catalog/categories', body)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); setModal(false); },
  });
  const eliminar = useMutation({
    mutationFn: (id) => api.delete(`/catalog/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categorias'] }),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categorías</h1>
          <p className="text-sm text-ink-500">Clasificación de productos</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm({ nombre: '', descripcion: '', orden: 0 }); setModal(true); }}><Plus size={16} /> Nueva categoría</Button>
      </div>

      <Card pad={false}>
        <Table headers={['Nombre', 'Descripción', 'Orden', 'Productos', 'Acciones']}>
          {data?.map((c) => (
            <tr key={c.id}>
              <Td className="font-medium">{c.nombre}</Td>
              <Td className="text-ink-500">{c.descripcion}</Td>
              <Td>{c.orden}</Td>
              <Td>{c._count.products}</Td>
              <Td>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setForm(c); setModal(true); }}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(c.id)}><Trash2 size={14} className="text-red-500" /></Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <div className="space-y-3">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Input label="Descripción" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          <Input label="Orden" type="number" value={form.orden} onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })} />
          {eliminar.isError && <div className="text-xs text-red-600">{eliminar.error?.response?.data?.error}</div>}
          <Button className="w-full" onClick={() => guardar.mutate(form)}>Guardar</Button>
        </div>
      </Modal>
    </div>
  );
}
