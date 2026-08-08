import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { useAuth } from '../../store/auth.js';
import { Card, Button, Input, Badge, Spinner } from '../../components/ui.jsx';
import { fecha } from '../../lib/format.js';
import { Save, KeyRound } from 'lucide-react';

export default function Perfil() {
  const qc = useQueryClient();
  const { updateProfile } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['perfil'], queryFn: () => api.get('/perfil') });

  const [form, setForm] = useState(null);
  const [pwd, setPwd] = useState({ passwordActual: '', passwordNueva: '', confirmar: '' });

  const guardar = useMutation({
    mutationFn: (body) => updateProfile(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['perfil'] }),
  });
  const cambiarPwd = useMutation({
    mutationFn: (body) => api.put('/perfil/password', body),
    onSuccess: () => setPwd({ passwordActual: '', passwordNueva: '', confirmar: '' }),
  });

  if (isLoading) return <Spinner />;
  if (!form && data) setForm({ ...data });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <Card className="xl:col-span-2" title="Mis datos" subtitle={`Miembro desde ${fecha(data?.createdAt)}`}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-14 w-14 rounded-full bg-brand-600 text-white flex items-center justify-center text-xl font-bold">
              {form?.nombre?.[0] || '?'}
            </div>
            <div>
              <div className="font-semibold">{form?.nombre}</div>
              <Badge color="bg-brand-50 text-brand-700 border-brand-200">{form?.rol}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Usuario" value={form?.username || ''} disabled />
            <Input label="Email" value={form?.email || ''} disabled />
          </div>
          <Input label="Nombre" value={form?.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <Input label="Teléfono" value={form?.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          {guardar.isSuccess && <div className="text-xs text-emerald-600">Datos actualizados</div>}
          {guardar.isError && <div className="text-xs text-red-600">{guardar.error?.response?.data?.error}</div>}
          <Button className="w-full" onClick={() => guardar.mutate({ nombre: form.nombre, telefono: form.telefono })} disabled={guardar.isPending}>
            <Save size={15} /> {guardar.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </Card>

      <Card title="Cambiar contraseña">
        <div className="space-y-3">
          <Input label="Contraseña actual" type="password" value={pwd.passwordActual} onChange={(e) => setPwd({ ...pwd, passwordActual: e.target.value })} />
          <Input label="Nueva contraseña" type="password" value={pwd.passwordNueva} onChange={(e) => setPwd({ ...pwd, passwordNueva: e.target.value })} />
          <Input label="Confirmar nueva" type="password" value={pwd.confirmar} onChange={(e) => setPwd({ ...pwd, confirmar: e.target.value })} />
          {cambiarPwd.isSuccess && <div className="text-xs text-emerald-600">Contraseña actualizada</div>}
          {cambiarPwd.isError && <div className="text-xs text-red-600">{cambiarPwd.error?.response?.data?.error}</div>}
          <Button
            className="w-full"
            variant="secondary"
            disabled={!pwd.passwordActual || pwd.passwordNueva.length < 6 || pwd.passwordNueva !== pwd.confirmar}
            onClick={() => cambiarPwd.mutate({ passwordActual: pwd.passwordActual, passwordNueva: pwd.passwordNueva })}
          >
            <KeyRound size={15} /> {cambiarPwd.isPending ? 'Actualizando...' : 'Actualizar contraseña'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
