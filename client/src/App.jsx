import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './store/auth.js';
import AppLayout from './components/layout/AppLayout.jsx';
import Login from './features/auth/Login.jsx';
import Dashboard from './features/dashboard/Dashboard.jsx';
import Mesas from './features/mozo/Mesas.jsx';
import NuevoPedido from './features/mozo/NuevoPedido.jsx';
import Pedidos from './features/pedidos/Pedidos.jsx';
import Puerta from './features/mozo/Puerta.jsx';
import Cocina from './features/cocina/Cocina.jsx';
import Productos from './features/catalogo/Productos.jsx';
import Categorias from './features/catalogo/Categorias.jsx';
import Recetas from './features/catalogo/Recetas.jsx';
import Inventario from './features/almacen/Inventario.jsx';
import Lotes from './features/almacen/Lotes.jsx';
import Mermas from './features/almacen/Mermas.jsx';
import Compras from './features/compras/Compras.jsx';
import Proveedores from './features/compras/Proveedores.jsx';
import Usuarios from './features/admin/Usuarios.jsx';
import Permisos from './features/admin/Permisos.jsx';
import Alertas from './features/alertas/Alertas.jsx';
import Reportes from './features/reportes/Reportes.jsx';
import Configuracion from './features/admin/Configuracion.jsx';
import Perfil from './features/perfil/Perfil.jsx';
import MenuCliente from './features/cliente/MenuCliente.jsx';
import PedidosCliente from './features/cliente/PedidosCliente.jsx';
import SeguirPedido from './features/cliente/SeguirPedido.jsx';
import { conectarSocket } from './socket.js';
import { ToastProvider } from './components/ui.jsx';
import Landing from './features/landing/index.jsx';

function Protected({ children }) {
  const { token, user } = useAuth();
  const location = useLocation();
  if (!token || !user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (user?.rol === 'CLIENTE') return <Navigate to="/cliente/menu" replace />;
  if (user?.rol === 'MOZO_SALON') return <Navigate to="/mesas" replace />;
  if (user?.rol === 'MOZO_PUERTA') return <Navigate to="/puerta" replace />;
  if (user?.rol === 'COCINERO') return <Navigate to="/cocina" replace />;
  if (user?.rol === 'ALMACENERO') return <Navigate to="/almacen" replace />;
  return <Dashboard />;
}

function Layout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function SocketInit() {
  const { token } = useAuth();
  React.useEffect(() => {
    if (token) conectarSocket(token);
  }, [token]);
  return null;
}

export default function App() {
  const { token, user } = useAuth();
  React.useEffect(() => {
    if (token) conectarSocket(token);
  }, [token]);

  return (
    <ToastProvider>
      <SocketInit />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={token && user ? <Navigate to={user.rol === 'CLIENTE' ? '/cliente/menu' : '/app'} replace /> : <Login />} />

        <Route path="/app" element={<Protected><Layout><Home /></Layout></Protected>} />
        <Route path="/mesas" element={<Protected><Layout><Mesas /></Layout></Protected>} />
        <Route path="/pedidos" element={<Protected><Layout><Pedidos /></Layout></Protected>} />
        <Route path="/puerta" element={<Protected><Layout><Puerta /></Layout></Protected>} />
        <Route path="/pedido/nuevo" element={<Protected><Layout><NuevoPedido /></Layout></Protected>} />
        <Route path="/pedido/nuevo/:mesaId" element={<Protected><Layout><NuevoPedido /></Layout></Protected>} />
        <Route path="/cocina" element={<Protected><Layout><Cocina /></Layout></Protected>} />
        <Route path="/productos" element={<Protected><Layout><Productos /></Layout></Protected>} />
        <Route path="/categorias" element={<Protected><Layout><Categorias /></Layout></Protected>} />
        <Route path="/recetas" element={<Protected><Layout><Recetas /></Layout></Protected>} />
        <Route path="/almacen" element={<Protected><Layout><Inventario /></Layout></Protected>} />
        <Route path="/lotes" element={<Protected><Layout><Lotes /></Layout></Protected>} />
        <Route path="/mermas" element={<Protected><Layout><Mermas /></Layout></Protected>} />
        <Route path="/compras" element={<Protected><Layout><Compras /></Layout></Protected>} />
        <Route path="/proveedores" element={<Protected><Layout><Proveedores /></Layout></Protected>} />
        <Route path="/usuarios" element={<Protected><Layout><Usuarios /></Layout></Protected>} />
        <Route path="/permisos" element={<Protected><Layout><Permisos /></Layout></Protected>} />
        <Route path="/alertas" element={<Protected><Layout><Alertas /></Layout></Protected>} />
        <Route path="/reportes" element={<Protected><Layout><Reportes /></Layout></Protected>} />
        <Route path="/configuracion" element={<Protected><Layout><Configuracion /></Layout></Protected>} />
        <Route path="/perfil" element={<Protected><Layout><Perfil /></Layout></Protected>} />

        <Route path="/cliente/menu" element={<Protected><Layout><MenuCliente /></Layout></Protected>} />
        <Route path="/cliente/pedidos" element={<Protected><Layout><PedidosCliente /></Layout></Protected>} />
        <Route path="/cliente/seguir" element={<Protected><Layout><SeguirPedido /></Layout></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}
