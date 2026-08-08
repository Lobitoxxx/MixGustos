import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Button, Card, Input, Select, Badge, Empty, Spinner } from '../../components/ui.jsx';
import { moneda, TIPOS_PEDIDO } from '../../lib/format.js';
import { Plus, Minus, Trash2, ShoppingCart, Send } from 'lucide-react';

export default function MenuCliente() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: menu, isLoading } = useQuery({ queryKey: ['menu-cliente'], queryFn: () => api.get('/client/menu') });
  const { data: mesas } = useQuery({ queryKey: ['mesas-cliente'], queryFn: () => api.get('/client/tables') });

  const [tipo, setTipo] = useState('PARA_LLEVAR');
  const [mesa, setMesa] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [obs, setObs] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cat, setCat] = useState('');
  const [cart, setCart] = useState([]);

  const crear = useMutation({
    mutationFn: (body) => api.post('/client/orders', body),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: ['menu-cliente'] });
      navigate(`/cliente/seguir?codigo=${o.codigo}`);
    },
  });

  const categorias = useMemo(() => [...new Set((menu || []).map((p) => p.categoria?.nombre).filter(Boolean))], [menu]);
  const productos = useMemo(() => (menu || []).filter((p) =>
    (!busqueda || p.nombre.toLowerCase().includes(busqueda.toLowerCase())) &&
    (!cat || p.categoria?.nombre === cat)
  ), [menu, busqueda, cat]);

  function agregar(p) {
    setCart((c) => {
      const ex = c.find((i) => i.productoId === p.id);
      return ex ? c.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i)) : [...c, { productoId: p.id, nombre: p.nombre, precio: p.precioVenta, cantidad: 1 }];
    });
  }
  function cambiarCantidad(productoId, delta) {
    setCart((c) => c.map((i) => (i.productoId === productoId ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i)).filter((i) => i.cantidad > 0));
  }
  const total = cart.reduce((a, i) => a + i.precio * i.cantidad, 0);

  function enviar() {
    if (cart.length === 0) return;
    crear.mutate({
      tipo,
      mesaId: tipo === 'MESA' ? mesa || undefined : undefined,
      clienteNombre: nombre || undefined,
      telefono: telefono || undefined,
      observaciones: obs || undefined,
      items: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
    });
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Nuestro menú</h1>
            <p className="text-sm text-ink-500">Selecciona lo que quieras y haz tu pedido</p>
          </div>
          <div className="flex gap-2">
            <Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="w-44" />
            <Select value={cat} onChange={(e) => setCat(e.target.value)} className="w-44">
              <option value="">Todas</option>
              {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {productos.map((p) => (
            <button key={p.id} onClick={() => agregar(p)} disabled={p.stock <= 0} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition ${p.stock <= 0 ? 'border-ink-100 opacity-50 cursor-not-allowed' : 'border-ink-200 hover:border-brand-400 hover:bg-brand-50/40'}`}>
              <div>
                <div className="font-medium text-sm">{p.nombre}</div>
                <div className="text-xs text-ink-400">{p.categoria?.nombre}</div>
                <div className="text-sm font-semibold text-brand-600 mt-0.5">{moneda(p.precioVenta)}</div>
              </div>
              {p.stock <= 0 ? <Badge color="bg-red-50 text-red-700 border-red-200">Agotado</Badge> : <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center"><Plus size={16} /></div>}
            </button>
          ))}
          {productos.length === 0 && <div className="col-span-2"><Empty text="No hay productos" /></div>}
        </div>
      </div>

      <div>
        <Card title="Tu pedido" subtitle={`${cart.length} producto(s)`}>
          {cart.length === 0 && <Empty text="Agrega productos del menú" />}
          <div className="space-y-3">
            {cart.map((i) => (
              <div key={i.productoId} className="rounded-lg border border-ink-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{i.nombre}</span>
                  <button onClick={() => cambiarCantidad(i.productoId, -i.cantidad)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => cambiarCantidad(i.productoId, -1)} className="h-6 w-6 rounded bg-ink-100 flex items-center justify-center"><Minus size={13} /></button>
                    <span className="w-8 text-center font-semibold text-sm">{i.cantidad}</span>
                    <button onClick={() => cambiarCantidad(i.productoId, 1)} className="h-6 w-6 rounded bg-ink-100 flex items-center justify-center"><Plus size={13} /></button>
                  </div>
                  <span className="font-semibold text-sm">{moneda(i.precio * i.cantidad)}</span>
                </div>
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {Object.entries(TIPOS_PEDIDO).map(([k, v]) => (
                  <button key={k} onClick={() => setTipo(k)} className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition ${tipo === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}>
                    {v.emoji} {v.label}
                  </button>
                ))}
                {tipo === 'MESA' && (
                  <Select value={mesa} onChange={(e) => setMesa(e.target.value)}>
                    <option value="">Seleccionar mesa...</option>
                    {mesas?.filter((m) => m.estado === 'LIBRE').map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                  </Select>
                )}
                {tipo !== 'MESA' && (
                  <>
                    <Input label="Tu nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" />
                    <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="999 999 999" />
                  </>
                )}
                <Input label="Observaciones" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ej: sin cebolla" />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
                <span className="text-sm text-ink-500">Total</span>
                <span className="text-xl font-bold text-brand-600">{moneda(total)}</span>
              </div>
              <Button className="w-full mt-3" onClick={enviar} disabled={crear.isPending || (tipo === 'MESA' && !mesa)}>
                <Send size={16} /> {crear.isPending ? 'Enviando...' : 'Hacer pedido'}
              </Button>
              {crear.isError && <div className="mt-2 text-xs text-red-600">{crear.error?.response?.data?.error}</div>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
