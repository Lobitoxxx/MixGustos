# MixGustos

Sistema Integral de Gestión y Optimización para Restaurantes.

Aplicación full-stack (monorepo npm) para administrar un restaurante de punta a punta: catálogo y recetas, mesas y pedidos (salón / para llevar / para recoger), cocina en tiempo real, almacén con gestión de lotes y método FEFO/PEPS, compras y proveedores, reportes, dashboard, alertas, portal del cliente y control de permisos por rol.

---

## Módulos

| Módulo | Descripción |
|---|---|
| **Autenticación y roles** | Login JWT, 7 roles, permisos configurables por rol (admin), perfil y cambio de contraseña |
| **Catálogo** | Categorías, productos (vendibles/insumos), recetas con sus ingredientes y rendimiento |
| **Mesas y pedidos** | Mesas (libre/ocupada/reservada), pedidos de salón, para llevar y para recoger, ciclo completo de estados con historial |
| **Cocina** | Kitchen display en tiempo real: recibir, preparar, marcar listo; notificaciones por socket |
| **Almacén** | Inventario, lotes con vencimiento, entradas/salidas, mermas, ajustes, selección de lotes FEFO/PEPS, consumo teórico vs real |
| **Compras** | Proveedores, órdenes de compra (borrador → enviada → recibida), recepción que crea lotes y movimientos, sugerencia de compra por stock mínimo |
| **Reportes** | Ventas, más vendidos, consumo y diferencias, mermas, inventario, rotación, compras, operación |
| **Dashboard** | KPIs, gráficos y alertas para administrador y gerente |
| **Alertas** | Vencidos, próximos a vencer, stock mínimo, reposición y diferencias de consumo; detección automática periódica |
| **Portal cliente** | Menú público, pedidos en línea y seguimiento en tiempo real |
| **Tiempo real** | Socket.IO: pedidos nuevos, cambios de estado, "plato listo", alertas y consumos |

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite 6, TailwindCSS 3, React Router 7, TanStack Query 5, Zustand, Recharts, Socket.IO Client, lucide-react |
| Backend | Node.js (ESM), Express 4, Socket.IO, JWT, bcryptjs |
| Datos | PostgreSQL 16 (Docker), Prisma 6 (ORM), migraciones + seed |
| Infra | Docker Compose, monorepo con npm workspaces y concurrently |

---

## Estructura del proyecto

```
MixGustos/
├─ docker-compose.yml          # PostgreSQL 16
├─ package.json                # workspaces y scripts raíz
├─ server/
│  ├─ .env                     # variables de entorno (no versionado)
│  ├─ prisma/
│  │  ├─ schema.prisma         # modelo de datos completo
│  │  ├─ migrations/           # migraciones SQL
│  │  └─ seed.js               # datos demo (usuarios, menú, inventario…)
│  └─ src/
│     ├─ config/               # configuración (puerto, JWT, CORS)
│     ├─ lib/                  # prisma, http, permisos
│     ├─ middleware/           # auth JWT, requireRol, requirePermiso, errores
│     ├─ routes/               # 13 módulos de API
│     ├─ services/             # alertas y motor FEFO/PEPS
│     └─ socket/               # Socket.IO (auth + eventos de dominio)
└─ client/
   └─ src/
      ├─ App.jsx               # rutas protegidas por sesión
      ├─ store/                # store de autenticación (Zustand)
      ├─ api/                  # cliente HTTP (axios)
      ├─ components/layout/    # layout y navegación según rol
      ├─ features/             # módulos: auth, mozo, cocina, almacen,
      │                        #  compras, catalogo, admin, reportes,
      │                        #  dashboard, alertas, perfil, cliente, pedidos
      └─ socket.js             # conexión Socket.IO con token
```

---

## Requisitos

- Node.js ≥ 18
- Docker (con el motor en ejecución)
- npm ≥ 9

---

## Puesta en marcha

```bash
# 1. Instalar dependencias (monorepo)
npm install

# 2. Levantar PostgreSQL
npm run db:up

# 3. Aplicar migraciones y sembrar datos demo
npm run migrate
npm run seed

# 4. Arrancar API + cliente (dev, con recarga en caliente)
npm run dev
```

Servicios:

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:5173 |
| API | http://localhost:4000/api |
| Health check | http://localhost:4000/api/health |
| Base de datos | postgresql://localhost:5432/mixgustos |

> La API expone también Socket.IO en `http://localhost:4000`. En desarrollo el cliente usa el proxy de Vite para `/api` y `/socket.io`.

---

## Usuarios demo

Todos con contraseña `123456`:

| Usuario | Rol | Pantalla inicial |
|---|---|---|
| `admin` | Administrador | Dashboard |
| `gerente` | Gerente | Dashboard |
| `mzsalon` | Mozo de salón | Mesas |
| `mzpuerta` | Mozo de puerta | Puerta / para llevar |
| `cocina` | Cocinero | Cocina |
| `almacen` | Almacenero | Almacén |
| `cliente` | Cliente | Menú del cliente |

El seed crea además: 6 platos, 13 insumos, 6 recetas, 30 lotes, 42 movimientos, 10 mesas, 5 proveedores, 8 órdenes de compra, 6 pedidos en distintos estados y 5 roles con permisos.

---

## Pantallas del cliente

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/login` | Inicio de sesión | Público |
| `/` | Dashboard (KPIs y gráficos) | Admin / Gerente |
| `/mesas` | Salón de mesas | Mozo de salón |
| `/puerta` | Pedidos para llevar/recoger | Mozo de puerta |
| `/pedidos` | Lista de pedidos | Mozos |
| `/pedido/nuevo[/:mesaId]` | Nuevo pedido | Mozos |
| `/cocina` | Pantalla de cocina | Cocinero |
| `/productos`, `/categorias`, `/recetas` | Catálogo | Admin / Gerente |
| `/almacen`, `/lotes`, `/mermas` | Almacén | Almacenero / Admin |
| `/compras`, `/proveedores` | Compras | Almacenero / Admin |
| `/reportes` | Reportes | Admin / Gerente |
| `/alertas` | Centro de alertas | Almacenero / Gerente / Admin |
| `/usuarios`, `/permisos`, `/configuracion` | Administración | Admin |
| `/perfil` | Perfil y contraseña | Todos |
| `/cliente/menu`, `/cliente/pedidos`, `/cliente/seguir` | Portal cliente | Cliente |

---

## Documentación técnica

- [Arquitectura y estructura](docs/arquitectura.md)
- [Base de datos (diagrama ER)](docs/base-de-datos.md)
- [API REST (referencia)](docs/api.md)
- [Flujos del negocio (diagramas Mermaid)](docs/flujos.md)
- [Grafo de conocimiento Graphify](docs/graphify.md)

---

## Scripts raíz

| Script | Descripción |
|---|---|
| `npm run dev` | API + cliente con recarga en caliente |
| `npm run dev:server` | Solo API |
| `npm run dev:client` | Solo cliente |
| `npm run db:up` / `npm run db:down` | Levantar / detener PostgreSQL |
| `npm run migrate` | Aplicar migraciones de Prisma |
| `npm run seed` | Cargar datos demo |
| `npm run build` | Compilar cliente y servidor |
| `npm run start` | Servir la API en producción |

---

> Proyecto académico/demo. Las credenciales y secretos incluidos son de desarrollo; cámbialos en producción.
