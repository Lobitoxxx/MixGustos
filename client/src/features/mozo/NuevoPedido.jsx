import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client.js';
import { Button, Card, Input, Select, Badge, Empty, Spinner } from '../../components/ui.jsx';
import { moneda, TIPOS_PEDIDO } from '../../lib/format.js';
import { Plus, Minus, Trash2, ShoppingCart, Send } from 'lucide-react';

export default function NuevoPedido() {
  const { mesaId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: mesas } = useQuery({ queryKey: ['mesas'], queryFn: () => api.get('/tables') });
  const { data: menu, isLoading } = useQuery({
    queryKey: ['productos-vendibles'],
    queryFn: () => api.get('/catalog/products?vendibles=true'),
  });

  const [tipo, setTipo] = useState(mesaId ? 'MESA' : 'PARA_LLEVAR');
  const [mesa, setMesa] = useState(mesaId || '');
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [obs, setObs] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cart, setCart] = useState([]);
  const [notaItem, setNotaItem] = useState({});

  const crear = useMutation({
    mutationFn: (body) => api.post('/orders', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mesas'] });
      qc.invalidateQueries({ queryKey: ['pedidos'] });
      navigate('/pedidos');
    },
  });

  const productos = useMemo(() => {
    if (!menu) return [];
    return menu.filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.categoria?.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  }, [menu, busqueda]);

  function agregar(p) {
    setCart((c) => {
      const ex = c.find((i) => i.productoId === p.id);
      if (ex) return c.map((i) => (i.productoId === p.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      return [...c, { productoId: p.id, nombre: p.nombre, precio: p.precioVenta, cantidad: 1 }];
    });
  }

  function cambiarCantidad(productoId, delta) {
    setCart((c) => c.map((i) => (i.productoId === productoId ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i)).filter((i) => i.cantidad > 0));
  }

  function quitar(productoId) {
    setCart((c) => c.filter((i) => i.productoId !== productoId));
  }

  const total = cart.reduce((a, i) => a + i.precio * i.cantidad, 0);

  function enviar() {
    if (cart.length === 0) return;
    crear.mutate({
      tipo,
      mesaId: tipo === 'MESA' ? mesa || undefined : undefined,
      clienteNombre: cliente || undefined,
      telefono: telefono || undefined,
      observaciones: obs || undefined,
      items: cart.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad, observaciones: notaItem[i.productoId] })),
    });
  }

  if (isLoading) return <Spinner />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-4">
        <Card title="Nuevo pedido" subtitle="Selecciona los productos">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {Object.entries(TIPOS_PEDIDO).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setTipo(k)}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${tipo === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500 hover:border-ink-300'}`}
              >
                {v.emoji} {v.label}
              </button>
            ))}
          </div>

          {tipo === 'MESA' && (
            <div className="mb-4">
              <Select label="Mesa" value={mesa} onChange={(e) => setMesa(e.target.value)}>
                <option value="">Seleccionar mesa...</option>
                {mesas?.filter((m) => m.estado === 'LIBRE').map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </Select>
            </div>
          )}

          <Input label="Buscar producto o categoría" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej: lomo, ceviche..." />

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {productos.length === 0 && <div className="col-span-2"><Empty text="No hay productos" /></div>}
            {productos.map((p) => (
              <button key={p.id} onClick={() => agregar(p)} className="flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2.5 text-left hover:border-brand-400 hover:bg-brand-50/40 transition">
                <div>
                  <div className="font-medium text-sm">{p.nombre}</div>
                  <div className="text-xs text-ink-400">{p.categoria?.nombre}</div>
                  <div className="text-sm font-semibold text-brand-600 mt-0.5">{moneda(p.precioVenta)}</div>
                </div>
                <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center"><Plus size={16} /></div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <Card title="Carrito" subtitle={`${cart.length} producto(s)`}>
          {cart.length === 0 && <Empty text="Agrega productos del menú" />}
          <div className="space-y-3">
            {cart.map((i) => (
              <div key={i.productoId} className="rounded-lg border border-ink-100 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{i.nombre}</span>
                  <button onClick={() => quitar(i.productoId)} className="text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button onClick={() => cambiarCantidad(i.productoId, -1)} className="h-6 w-6 rounded bg-ink-100 flex items-center justify-center"><Minus size={13} /></button>
                    <span className="w-8 text-center font-semibold text-sm">{i.cantidad}</span>
                    <button onClick={() => cambiarCantidad(i.productoId, 1)} className="h-6 w-6 rounded bg-ink-100 flex items-center justify-center"><Plus size={13} /></button>
                  </div>
                  <span className="font-semibold text-sm">{moneda(i.precio * i.cantidad)}</span>
                </div>
                <input
                  value={notaItem[i.productoId] || ''}
                  onChange={(e) => setNotaItem((n) => ({ ...n, [i.productoId]: e.target.value }))}
                  placeholder="Nota para cocina..."
                  className="mt-2 w-full text-xs rounded-lg border border-ink-100 px-2 py-1.5 outline-none focus:border-brand-400"
                />
              </div>
            ))}
          </div>

          {cart.length > 0 && (
            <>
              <div className="mt-4 space-y-2">
                {tipo !== 'MESA' && (
                  <>
                    <Input label="Nombre del cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente" />
                    <Input label="Teléfono" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="999 999 999" />
                  </>
                )}
                <Input label="Observaciones generales" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Sin ají, más picante..." />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3">
                <span className="text-sm text-ink-500">Total</span>
                <span className="text-xl font-bold text-brand-600">{moneda(total)}</span>
              </div>
              <Button onClick={enviar} className="w-full mt-3" disabled={crear.isPending || (tipo === 'MESA' && !mesa)}>
                <Send size={16} />
                {crear.isPending ? 'Creando...' : 'Crear pedido'}
              </Button>
              {crear.isError && <div className="mt-2 text-xs text-red-600">{crear.error?.response?.data?.error}</div>}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
