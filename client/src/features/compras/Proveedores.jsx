import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Modal, Spinner, Table, Td, Badge, Empty } from '../../components/ui.jsx';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ESTADO_COLOR = {
  ACTIVO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVO: 'bg-ink-100 text-ink-500 border-ink-200',
};

export default function Proveedores() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['proveedores'], queryFn: () => api.get('/purchases/suppliers') });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: '', ruc: '', telefono: '', email: '', direccion: '' });
  const [editing, setEditing] = useState(null);

  const guardar = useMutation({
    mutationFn: (body) => (editing ? api.put(`/purchases/suppliers/${editing.id}`, body) : api.post('/purchases/suppliers', body)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['proveedores'] }); setModal(false); },
  });
  const eliminar = useMutation({
    mutationFn: (id) => api.delete(`/purchases/suppliers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  });

  function abrirNuevo() {
    setEditing(null);
    setForm({ nombre: '', ruc: '', telefono: '', email: '', direccion: '' });
    setModal(true);
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-ink-500">{data?.length || 0} registrados</p>
        </div>
        <Button onClick={abrirNuevo}><Plus size={16} /> Nuevo proveedor</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {data?.map((s) => (
          <Card key={s.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{s.nombre}</h3>
                <div className="text-xs text-ink-400">{s.ruc || 'Sin RUC'}</div>
              </div>
              <Badge color={s.activo === false ? ESTADO_COLOR.INACTIVO : ESTADO_COLOR.ACTIVO}>{s.activo === false ? 'Inactivo' : 'Activo'}</Badge>
            </div>
            <div className="mt-3 space-y-1 text-sm text-ink-600">
              {s.telefono && <div>📞 {s.telefono}</div>}
              {s.email && <div>✉️ {s.email}</div>}
              {s.direccion && <div>📍 {s.direccion}</div>}
              {!s.telefono && !s.email && !s.direccion && <div className="text-ink-300">Sin datos de contacto</div>}
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
              <span className="text-xs text-ink-400">{s._count.purchaseOrders} orden(es) de compra</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => { setEditing(s); setForm({ nombre: s.nombre, ruc: s.ruc || '', telefono: s.telefono || '', email: s.email || '', direccion: s.direccion || '' }); setModal(true); }}><Pencil size={14} /></Button>
                <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(s.id)}><Trash2 size={14} className="text-red-500" /></Button>
              </div>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <Empty text="Aún no hay proveedores" />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}>
        <div className="space-y-3">
          <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Input label="RUC" value={form.ruc} onChange={(e) => setForm({ ...form, ruc: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            <Input label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          {(guardar.isError || eliminar.isError) && <div className="text-xs text-red-600">{(guardar.error || eliminar.error)?.response?.data?.error}</div>}
          <Button className="w-full" disabled={!form.nombre} onClick={() => guardar.mutate(form)}>{guardar.isPending ? 'Guardando...' : 'Guardar'}</Button>
        </div>
      </Modal>
    </div>
  );
}
