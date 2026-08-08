import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Input, Select, Modal, Badge, Spinner, Table, Td } from '../../components/ui.jsx';
import { fecha } from '../../lib/format.js';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const ROLES = ['ADMINISTRADOR', 'GERENTE', 'MOZO_SALON', 'MOZO_PUERTA', 'COCINERO', 'ALMACENERO', 'CLIENTE'];
const ROL_LABEL = {
  ADMINISTRADOR: 'Administrador', GERENTE: 'Gerente', MOZO_SALON: 'Mozo de salón',
  MOZO_PUERTA: 'Mozo de puerta', COCINERO: 'Cocinero', ALMACENERO: 'Almacenero', CLIENTE: 'Cliente',
};
const ROL_COLOR = {
  ADMINISTRADOR: 'bg-purple-50 text-purple-700 border-purple-200',
  GERENTE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MOZO_SALON: 'bg-sky-50 text-sky-700 border-sky-200',
  MOZO_PUERTA: 'bg-teal-50 text-teal-700 border-teal-200',
  COCINERO: 'bg-amber-50 text-amber-700 border-amber-200',
  ALMACENERO: 'bg-orange-50 text-orange-700 border-orange-200',
  CLIENTE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function Usuarios() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['usuarios'], queryFn: () => api.get('/users') });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', rol: 'MOZO_SALON', nombre: '', telefono: '', activo: true });
  const [editing, setEditing] = useState(null);

  const guardar = useMutation({
    mutationFn: (body) => (editing ? api.put(`/users/${editing.id}`, body) : api.post('/users', body)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); setModal(false); },
  });
  const toggleEstado = useMutation({
    mutationFn: ({ id, activo }) => api.patch(`/users/${id}/estado`, { activo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });
  const eliminar = useMutation({
    mutationFn: (id) => api.put(`/users/${id}`, { activo: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  if (isLoading) return <Spinner />;

  function abrirNuevo() {
    setEditing(null);
    setForm({ username: '', email: '', password: '', rol: 'MOZO_SALON', nombre: '', telefono: '', activo: true });
    setModal(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-sm text-ink-500">{data?.length || 0} cuentas registradas</p>
        </div>
        <Button onClick={abrirNuevo}><Plus size={16} /> Nuevo usuario</Button>
      </div>

      <Card pad={false}>
        <Table headers={['Usuario', 'Nombre', 'Rol', 'Contacto', 'Estado', 'Creado', 'Acciones']}>
          {data?.map((u) => (
            <tr key={u.id} className="hover:bg-ink-50/50">
              <Td>
                <div className="font-medium">{u.username}</div>
                <div className="text-xs text-ink-400">{u.email}</div>
              </Td>
              <Td>{u.nombre}</Td>
              <Td><Badge color={ROL_COLOR[u.rol]}>{ROL_LABEL[u.rol]}</Badge></Td>
              <Td className="text-sm text-ink-500">{u.telefono || '—'}</Td>
              <Td>
                <button onClick={() => toggleEstado.mutate({ id: u.id, activo: !u.activo })}>
                  <Badge color={u.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge>
                </button>
              </Td>
              <Td className="text-sm text-ink-400">{fecha(u.createdAt)}</Td>
              <Td>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => { setEditing(u); setForm({ username: u.username, email: u.email, password: '', rol: u.rol, nombre: u.nombre, telefono: u.telefono || '', activo: u.activo }); setModal(true); }}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => eliminar.mutate(u.id)}><Trash2 size={14} className="text-red-500" /></Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Editar ${editing.nombre}` : 'Nuevo usuario'} width="max-w-xl">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <Input label="Nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <Select label="Rol" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
            {ROLES.map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
          </Select>
          <Input label={editing ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {(guardar.isError || eliminar.isError) && <div className="text-xs text-red-600">{(guardar.error || eliminar.error)?.response?.data?.error}</div>}
          <Button className="w-full" disabled={!form.username || !form.nombre || !form.email || (!editing && !form.password)} onClick={() => guardar.mutate(form)}>
            {guardar.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
