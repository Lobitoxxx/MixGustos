import React, { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Card, Button, Badge, Spinner, Select } from '../../components/ui.jsx';
import { Save, ShieldCheck } from 'lucide-react';

const ROL_LABEL = {
  ADMINISTRADOR: 'Administrador', GERENTE: 'Gerente', MOZO_SALON: 'Mozo de salón',
  MOZO_PUERTA: 'Mozo de puerta', COCINERO: 'Cocinero', ALMACENERO: 'Almacenero', CLIENTE: 'Cliente',
};

export default function Permisos() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['permisos'], queryFn: () => api.get('/users/roles/permisos') });
  const [rolSel, setRolSel] = useState('GERENTE');
  const [seleccion, setSeleccion] = useState({});

  const guardar = useMutation({
    mutationFn: ({ rol, permisos }) => api.put(`/users/roles/permisos/${rol}`, { permisos }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['permisos'] }),
  });

  if (isLoading) return <Spinner />;

  const rolActual = rolSel;
  const activos = new Set(seleccion[rolActual] ?? data?.permisosPorRol?.[rolActual] ?? []);

  function toggle(p) {
    const nuevo = new Set(activos);
    if (nuevo.has(p)) nuevo.delete(p); else nuevo.add(p);
    setSeleccion((s) => ({ ...s, [rolActual]: [...nuevo] }));
  }

  function seleccionarTodo() {
    setSeleccion((s) => ({ ...s, [rolActual]: data.permisosDisponibles }));
  }
  function limpiar() {
    setSeleccion((s) => ({ ...s, [rolActual]: [] }));
  }

  const grupos = {};
  for (const p of data.permisosDisponibles) {
    const [modulo] = p.split('.');
    (grupos[modulo] ||= []).push(p);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Permisos por rol</h1>
          <p className="text-sm text-ink-500">Control granular de acceso a módulos y acciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={rolSel} onChange={(e) => setRolSel(e.target.value)}>
            {data.roles.filter((r) => r !== 'ADMINISTRADOR').map((r) => <option key={r} value={r}>{ROL_LABEL[r]}</option>)}
          </Select>
          <Button variant="secondary" onClick={seleccionarTodo}>Seleccionar todo</Button>
          <Button variant="ghost" onClick={limpiar}>Limpiar</Button>
          <Button onClick={() => guardar.mutate({ rol: rolActual, permisos: [...activos] })} disabled={guardar.isPending}>
            <Save size={15} /> {guardar.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      <Card title={`Permisos de ${ROL_LABEL[rolActual]}`} subtitle={`${activos.size} de ${data.permisosDisponibles.length} permisos activos`}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Object.entries(grupos).map(([modulo, perms]) => (
            <div key={modulo} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-brand-600" />
                <span className="font-semibold capitalize">{modulo}</span>
              </div>
              <div className="space-y-1.5">
                {perms.map((p) => {
                  const [_, accion] = p.split('.');
                  const on = activos.has(p);
                  return (
                    <label key={p} className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-sm cursor-pointer transition ${on ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-100 hover:border-ink-200'}`}>
                      <span className="capitalize">{accion.replace(/_/g, ' ')}</span>
                      <input type="checkbox" checked={on} onChange={() => toggle(p)} className="accent-brand-600 h-4 w-4" />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {guardar.isSuccess && <div className="mt-4 text-xs text-emerald-600"><Badge color="bg-emerald-50 text-emerald-700 border-emerald-200">Permisos guardados</Badge></div>}
        {guardar.isError && <div className="mt-4 text-xs text-red-600">{guardar.error?.response?.data?.error}</div>}
      </Card>
    </div>
  );
}
