import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, KeyRound, Tags, Package, BookOpen, Armchair,
  Truck, ShoppingCart, Warehouse, Bell, BarChart3, Settings, LogOut,
  ClipboardList, ChefHat, Menu as MenuIcon, X, Utensils, UserCircle, Store,
  PanelLeftClose, PanelLeftOpen, Search, BellRing, Command, CreditCard,
} from 'lucide-react';
import { useAuth } from '../../store/auth.js';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { Badge, Menu, MenuItem, Tooltip } from '../ui.jsx';
import { fechaHora } from '../../lib/format.js';

export const MENU = [
  { label: 'Dashboard', path: '/app', icon: LayoutDashboard, permiso: 'dashboard.ver', roles: ['ADMINISTRADOR', 'GERENTE'], grupo: 'Operación' },
  { label: 'Mesas', path: '/mesas', icon: Armchair, permiso: 'mesas.ver', roles: ['ADMINISTRADOR', 'GERENTE', 'MOZO_SALON'], grupo: 'Operación' },
  { label: 'Pedidos', path: '/pedidos', icon: ClipboardList, permiso: 'pedidos.ver', roles: ['ADMINISTRADOR', 'GERENTE', 'MOZO_SALON', 'MOZO_PUERTA'], grupo: 'Operación' },
  { label: 'Puerta (llevar/recoger)', path: '/puerta', icon: Store, permiso: 'pedidos.crear', roles: ['MOZO_PUERTA', 'ADMINISTRADOR'], grupo: 'Operación' },
  { label: 'Cocina', path: '/cocina', icon: ChefHat, permiso: 'cocina.ver', roles: ['ADMINISTRADOR', 'COCINERO'], grupo: 'Operación' },
  { label: 'Productos', path: '/productos', icon: Package, permiso: 'catalogo.ver', roles: ['ADMINISTRADOR', 'GERENTE'], grupo: 'Catálogo' },
  { label: 'Categorías', path: '/categorias', icon: Tags, permiso: 'catalogo.gestionar', roles: ['ADMINISTRADOR'], grupo: 'Catálogo' },
  { label: 'Recetas', path: '/recetas', icon: BookOpen, permiso: 'recetas.ver', roles: ['ADMINISTRADOR', 'GERENTE'], grupo: 'Catálogo' },
  { label: 'Almacén', path: '/almacen', icon: Warehouse, permiso: 'almacen.ver', roles: ['ADMINISTRADOR', 'GERENTE', 'ALMACENERO'], grupo: 'Almacén' },
  { label: 'Lotes & FEFO/PEPS', path: '/lotes', icon: Package, permiso: 'lotes.ver', roles: ['ADMINISTRADOR', 'GERENTE', 'ALMACENERO'], grupo: 'Almacén' },
  { label: 'Mermas', path: '/mermas', icon: Package, permiso: 'inventario.gestionar', roles: ['ADMINISTRADOR', 'ALMACENERO'], grupo: 'Almacén' },
  { label: 'Compras', path: '/compras', icon: ShoppingCart, permiso: 'compras.ver', roles: ['ADMINISTRADOR', 'GERENTE', 'ALMACENERO'], grupo: 'Almacén' },
  { label: 'Proveedores', path: '/proveedores', icon: Truck, permiso: 'proveedores.ver', roles: ['ADMINISTRADOR', 'GERENTE', 'ALMACENERO'], grupo: 'Almacén' },
  { label: 'Alertas', path: '/alertas', icon: Bell, permiso: 'almacen.ver', roles: ['ADMINISTRADOR', 'GERENTE', 'ALMACENERO'], grupo: 'Almacén' },
  { label: 'Usuarios', path: '/usuarios', icon: Users, permiso: 'usuarios.gestionar', roles: ['ADMINISTRADOR'], grupo: 'Administración' },
  { label: 'Permisos', path: '/permisos', icon: KeyRound, permiso: 'permisos.gestionar', roles: ['ADMINISTRADOR'], grupo: 'Administración' },
  { label: 'Reportes', path: '/reportes', icon: BarChart3, permiso: 'reportes.ver', roles: ['ADMINISTRADOR', 'GERENTE'], grupo: 'Administración' },
  { label: 'Configuración', path: '/configuracion', icon: Settings, permiso: 'configuracion.gestionar', roles: ['ADMINISTRADOR'], grupo: 'Administración' },
];

export const MENU_CLIENTE = [
  { label: 'Menú', path: '/cliente/menu', icon: Utensils },
  { label: 'Mis pedidos', path: '/cliente/pedidos', icon: ClipboardList },
  { label: 'Seguir pedido', path: '/cliente/seguir', icon: CreditCard },
  { label: 'Mi Perfil', path: '/perfil', icon: UserCircle },
];

const ROL_NOMBRE = {
  ADMINISTRADOR: 'Administrador', GERENTE: 'Gerente', MOZO_SALON: 'Mozo de salón',
  MOZO_PUERTA: 'Mozo de puerta', COCINERO: 'Cocinero', ALMACENERO: 'Almacenero', CLIENTE: 'Cliente',
};

const GRUPOS = ['Operación', 'Catálogo', 'Almacén', 'Administración'];

function filtrarItems(items, user) {
  return items.filter((i) => !i.permiso || user.rol === 'ADMINISTRADOR' || user.permisos?.includes(i.permiso));
}

function NavItem({ item, collapsed, onNavigate }) {
  return (
    <Tooltip label={collapsed ? item.label : null} side="right" className="w-full">
      <NavLink
        to={item.path}
        onClick={onNavigate}
        className={({ isActive }) =>
          `flex items-center rounded-xl text-sm transition-all duration-150 ${
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
          } ${
            isActive
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25 font-semibold'
              : 'text-ink-300 hover:bg-ink-800 hover:text-white'
          }`
        }
      >
        <item.icon size={18} className="shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </NavLink>
    </Tooltip>
  );
}

function NavItems({ items, user, collapsed, onNavigate }) {
  const filtered = filtrarItems(items, user);
  if (items === MENU_CLIENTE) {
    return (
      <nav className="space-y-1">
        {filtered.map((item) => <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />)}
      </nav>
    );
  }
  return (
    <nav className="space-y-5">
      {GRUPOS.map((grupo) => {
        const grupales = filtered.filter((i) => i.grupo === grupo);
        if (grupales.length === 0) return null;
        return (
          <div key={grupo}>
            {!collapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">{grupo}</div>
            )}
            <div className="space-y-1">
              {grupales.map((item) => <NavItem key={item.path} item={item} collapsed={collapsed} onNavigate={onNavigate} />)}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const inputRef = React.useRef(null);
  const esCliente = user?.rol === 'CLIENTE';

  const items = React.useMemo(() => {
    const base = esCliente ? MENU_CLIENTE : MENU.filter((i) => !i.permiso || user.rol === 'ADMINISTRADOR' || user.permisos?.includes(i.permiso));
    if (!q.trim()) return base.slice(0, 8);
    const t = q.toLowerCase();
    return base.filter((i) => i.label.toLowerCase().includes(t)).slice(0, 8);
  }, [q, user, esCliente]);

  React.useEffect(() => {
    if (open) {
      setQ('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  function ir(item) {
    navigate(item.path);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white border border-ink-100 shadow-2xl overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 border-b border-ink-100">
          <Search size={18} className="text-ink-400 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar sección o acción..."
            className="w-full py-3.5 text-sm outline-none bg-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && items[0]) ir(items[0]);
              if (e.key === 'Escape') onClose();
            }}
          />
          <kbd className="text-[10px] text-ink-400 border border-ink-200 rounded-md px-1.5 py-0.5">esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto scroll-thin p-1.5">
          {items.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-400">Sin resultados para "{q}"</div>
          ) : (
            items.map((item) => (
              <button
                key={item.path}
                onClick={() => ir(item)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition text-left"
              >
                <span className="h-8 w-8 rounded-lg bg-ink-100 text-ink-500 flex items-center justify-center shrink-0">
                  <item.icon size={15} />
                </span>
                <span className="text-sm font-medium text-ink-700">{item.label}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function AlertsBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: alertas } = useQuery({
    queryKey: ['alertas-header'],
    queryFn: () => api.get('/alerts'),
    refetchInterval: 30000,
  });
  const nuevas = (alertas || []).filter((a) => a.estado === 'NUEVA');

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`relative p-2 rounded-xl transition hover:bg-ink-100 ${open ? 'bg-ink-100' : ''}`}
      >
        <Bell size={19} className="text-ink-500" />
        {nuevas.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
            {nuevas.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-ink-100 shadow-lift overflow-hidden z-50 animate-scale-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
              <div className="flex items-center gap-2">
                <BellRing size={15} className="text-brand-600" />
                <span className="font-semibold text-sm">Alertas</span>
              </div>
              <Badge color={nuevas.length > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}>
                {nuevas.length > 0 ? `${nuevas.length} nuevas` : 'Todo al día'}
              </Badge>
            </div>
            <div className="max-h-80 overflow-y-auto scroll-thin divide-y divide-ink-50">
              {nuevas.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-ink-400">No hay alertas pendientes</div>
              ) : (
                nuevas.slice(0, 5).map((a) => (
                  <div key={a.id} className="px-4 py-3 hover:bg-ink-50 transition cursor-pointer" onClick={() => { setOpen(false); navigate('/alertas'); }}>
                    <div className="flex items-start gap-2.5">
                      <span className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-ink-800 truncate">{a.titulo}</div>
                        <div className="text-xs text-ink-500 mt-0.5 line-clamp-2">{a.mensaje}</div>
                        <div className="text-[11px] text-ink-400 mt-1">{fechaHora(a.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              onClick={() => { setOpen(false); navigate('/alertas'); }}
              className="w-full py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50 border-t border-ink-100 transition"
            >
              Ver todas las alertas
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('mg_sidebar') === '1');
  const esCliente = user?.rol === 'CLIENTE';
  const puedeAlertas = user?.rol === 'ADMINISTRADOR' || user?.rol === 'GERENTE' || user?.permisos?.includes('almacen.ver');

  const setSidebar = (val) => {
    setCollapsed(val);
    localStorage.setItem('mg_sidebar', val ? '1' : '0');
  };

  React.useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const paginaActual = (esCliente ? MENU_CLIENTE : MENU).find((i) => i.path === location.pathname);

  const sidebar = (
    <div className="h-full flex flex-col bg-ink-900 text-white">
      <div className={`flex items-center gap-3 border-b border-ink-800 ${collapsed ? 'px-3 justify-center' : 'px-5'} py-4`}>
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-500 to-amber-600 flex items-center justify-center shadow-lg shadow-brand-600/30 shrink-0">
          <Utensils size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-display italic text-lg leading-tight text-cream">MixGustos</div>
            <div className="text-[11px] text-ink-400">Gestión de restaurante</div>
          </div>
        )}
      </div>

      <div className={`flex-1 overflow-y-auto scroll-thin py-4 ${collapsed ? 'px-2.5' : 'px-3'}`}>
        {esCliente ? (
          <NavItems items={MENU_CLIENTE} user={user} collapsed={collapsed} />
        ) : (
          <NavItems items={MENU} user={user} collapsed={collapsed} />
        )}
      </div>

      <div className={`p-3 border-t border-ink-800 flex flex-col gap-1`}>
        <div className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="h-9 w-9 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold shrink-0">
            {user?.nombre?.[0] || '?'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user?.nombre}</div>
              <div className="text-[11px] text-brand-400">{ROL_NOMBRE[user?.rol]}</div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`flex items-center rounded-xl text-sm text-ink-300 hover:bg-ink-800 hover:text-white transition ${collapsed ? 'justify-center px-2.5 py-2.5' : 'gap-3 px-3 py-2.5'}`}
        >
          <LogOut size={17} />
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <aside className={`hidden lg:block shrink-0 fixed inset-y-0 z-30 transition-all duration-200 ${collapsed ? 'w-[74px]' : 'w-64'}`}>
        {sidebar}
      </aside>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${collapsed ? 'lg:ml-[74px]' : 'lg:ml-64'}`}>
        <header className="sticky top-0 z-20 bg-cream/85 backdrop-blur-md border-b border-ink-100 px-4 lg:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button className="lg:hidden p-2 rounded-xl hover:bg-ink-100 text-ink-600" onClick={() => setOpen(true)}>
              <MenuIcon size={20} />
            </button>
            <div className="hidden lg:flex">
              <button
                onClick={() => setSidebar(!collapsed)}
                className="p-2 rounded-xl hover:bg-ink-100 text-ink-500 transition"
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {paginaActual?.grupo || (esCliente ? 'Cliente' : ROL_NOMBRE[user?.rol])}
              </div>
              <div className="font-display italic text-base text-cacao truncate">{paginaActual?.label || 'MixGustos'}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-ink-200 bg-ink-50/50 text-ink-500 hover:bg-ink-100 hover:text-ink-700 text-xs transition"
            >
              <Search size={14} />
              <span className="hidden md:block">Buscar...</span>
              <kbd className="text-[10px] text-ink-400 border border-ink-200 rounded-md px-1 py-px bg-white">Ctrl K</kbd>
            </button>

            {puedeAlertas && <AlertsBell />}

            <Menu
              button={
                <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-ink-100 transition">
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-amber-600 text-white flex items-center justify-center text-sm font-bold">
                    {user?.nombre?.[0] || '?'}
                  </span>
                  <span className="hidden sm:block text-sm font-medium text-ink-700 max-w-[120px] truncate">
                    {user?.nombre}
                  </span>
                </button>
              }
            >
              <MenuItem icon={<UserCircle size={16} />} onClick={() => navigate('/perfil')}>Mi perfil</MenuItem>
              <MenuItem icon={<LogOut size={16} />} onClick={handleLogout} danger>Cerrar sesión</MenuItem>
            </Menu>
          </div>
        </header>

        <main key={location.pathname} className="flex-1 p-4 lg:p-6 min-w-0 animate-fade-in">
          {children}
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-ink-900">
            <button onClick={() => setOpen(false)} className="absolute top-3 right-3 p-2 text-ink-300 hover:text-white">
              <X size={18} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
