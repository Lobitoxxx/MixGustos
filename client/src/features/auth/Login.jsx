import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils, LogIn, ShieldCheck, Armchair, ChefHat, Warehouse, Store, BarChart3, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../store/auth.js';
import { Button, Input } from '../../components/ui.jsx';

const DEMO = [
  { u: 'admin', label: 'Administrador', icon: ShieldCheck },
  { u: 'gerente', label: 'Gerente', icon: BarChart3 },
  { u: 'mzsalon', label: 'Mozo de salón', icon: Armchair },
  { u: 'mzpuerta', label: 'Mozo de puerta', icon: Store },
  { u: 'cocina', label: 'Cocinero', icon: ChefHat },
  { u: 'almacen', label: 'Almacenero', icon: Warehouse },
  { u: 'cliente', label: 'Cliente', icon: User },
];

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(usuario, password);
      navigate(user.rol === 'CLIENTE' ? '/cliente/menu' : '/app', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-brand-950">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-amber-500/20 blur-3xl animate-pulse" />
      <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-rose-500/10 blur-2xl" />

      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-6 relative z-10">
        <div className="hidden lg:flex flex-col justify-center text-white p-6 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center shadow-xl shadow-brand-600/40">
              <Utensils size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight">MixGustos</div>
              <div className="text-sm text-ink-300">Sistema Integral de Restaurantes</div>
            </div>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-4">
            Gestiona tu restaurante de forma <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-brand-400">simple y moderna</span>
          </h2>
          <ul className="space-y-3 text-sm text-ink-200">
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-brand-400" /> Pedidos de salón y puerta en tiempo real</li>
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-amber-400" /> Cocina sincronizada por sockets</li>
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-rose-400" /> Inventario con control FEFO y alertas</li>
            <li className="flex items-center gap-3"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Reportes y portal del cliente</li>
          </ul>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 animate-fade-in-up border border-white/20">
          <div className="flex flex-col items-center mb-6 lg:hidden">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center text-white mb-3 shadow-xl shadow-brand-600/40">
              <Utensils size={28} />
            </div>
            <h1 className="text-2xl font-bold text-ink-900">MixGustos</h1>
            <p className="text-sm text-ink-500">Sistema Integral de Restaurantes</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-ink-800 mb-1">Bienvenido de nuevo</div>
              <p className="text-xs text-ink-500 mb-4">Ingresa con tu cuenta para continuar</p>
            </div>
            <Input label="Usuario o correo" value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="admin" autoFocus icon={<User size={16} />} />
            <Input label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 animate-fade-in-down">{error}</div>
            )}
            <Button type="submit" className="w-full" loading={loading} disabled={!usuario || !password}>
              <LogIn size={16} />
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-ink-100">
            <p className="text-xs text-ink-500 mb-2 flex items-center gap-1.5">
              <Sparkles size={12} className="text-brand-500" />
              Cuentas demo — toca una para autocompletar (<b>123456</b>)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {DEMO.map(({ u, label, icon: Icon }) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => { setUsuario(u); setPassword('123456'); }}
                  className="group flex items-center gap-2 text-xs text-left px-3 py-2 rounded-xl bg-ink-50 hover:bg-brand-50 hover:border-brand-200 border border-transparent text-ink-700 transition"
                >
                  <span className="h-7 w-7 rounded-lg bg-white border border-ink-100 text-ink-500 group-hover:text-brand-600 flex items-center justify-center shrink-0 transition">
                    <Icon size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="font-semibold block leading-tight">{u}</span>
                    <span className="block text-ink-400 truncate">{label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
