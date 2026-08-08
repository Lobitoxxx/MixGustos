# AGENTS.md — Contexto para agentes y herramientas

MixGustos es un **sistema integral de gestión y optimización para restaurantes**: landing pública, portal del cliente y paneles por rol (admin, gerente, mozos, cocina, almacén) en una sola app full-stack (monorepo npm).

## Estado actual

- Landing pública (`/`) completa: Hero, PlatosDestacados, SeguirMiPedido (código + WhatsApp con aviso al mozo por socket), Galería parallax, Recetas, Estadísticas, Reservas y footer.
- Portal cliente con menú online, pedidos (mesa / para llevar / para recoger) y seguimiento en vivo.
- Módulos operativos: mesas, pedidos, cocina (kitchen display en tiempo real), catálogo, almacén con lotes FEFO/PEPS, compras, reportes, alertas, usuarios y permisos.
- Tema visual unificado y cálido: paleta `cream`/`cacao`/`brand` (naranja) con la serif `Instrument Serif` en títulos. Definida en `client/tailwind.config.js` (paleta `ink` re-mapeada a tonos cálidos).

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18, Vite 6, TailwindCSS 3, React Router 7, TanStack Query 5, Zustand, Recharts, Socket.IO Client, lucide-react, framer-motion, GSAP |
| Backend | Node.js (ESM), Express 4, Socket.IO, JWT, bcryptjs |
| Datos | PostgreSQL 16 (Docker), Prisma 6, migraciones + seed |
| Infra | Docker Compose, monorepo npm workspaces + concurrently |

## Arranque

```bash
npm install          # dependencias del monorepo
npm run db:up        # PostgreSQL (Docker)
npm run migrate      # migraciones Prisma
npm run seed         # datos demo
npm run dev          # API (:4000) + cliente (:5173) con hot reload
```

- Verificación: `npm run build` (compila cliente + servidor). No hay suite de tests.
- Usuarios demo (contraseña `123456`): `admin`, `gerente`, `mzsalon`, `mzpuerta`, `cocina`, `almacen`, `cliente`.

## Estructura

```
server/  → src/{config,lib,middleware,routes,services,socket}, prisma/
client/  → src/{components/layout, features/*, lib, api, store}, tailwind.config.js
docs/    → arquitectura, base-de-datos, api, flujos, graphify
```

## Convenciones

- **Rutas**: `client/src/App.jsx` define rutas protegidas por sesión/rol (`Protected` + layout `AppLayout`). Los roles se redirigen a su pantalla inicial desde `Home()`.
- **Componentes de UI**: todo pasa por `client/src/components/ui.jsx` (Button, Card, Input, Badge, Table, Modal, StatCard, PageHeader, useToast, etc.). No crees componentes duplicados.
- **Formato/datos**: helpers en `client/src/lib/format.js` (`moneda`, `fecha`, `badgePedido`, `TIPOS_PEDIDO`, `ESTADOS_PEDIDO`).
- **API**: `client/src/api/client.js` (axios, base `/api`, inyecta JWT, redirige a `/login` en 401). En dev, Vite hace proxy de `/api` y `/socket.io`.
- **Tiempo real**: `client/src/socket.js` (`conectarSocket`/`getSocket`). Eventos: `pedido:nuevo`, `pedido:estado`, `pedido:listo`, `pedido:aviso`, `alerta:nueva`, `consumo:realizado`. El server los emite desde `server/src/socket/index.js` hacia salas `rol:<ROL>`.
- **Permisos**: `server/src/lib/permisos.js` define permisos por rol; `requireRol`/`requirePermiso` en `server/src/middleware/auth.js`.
- **FEFO/PEPS**: motor en `server/src/services/fefoPeps.js` (`consumirProducto`, `stockProducto`). Alertas en `server/src/services/alertas.js`.
- **API del cliente (pública)**: `server/src/routes/client.routes.js` — menú, mesas, pedidos, seguimiento por código y registro de WhatsApp (`POST /api/client/orders/:codigo/telefono`, emite `pedido:aviso`).
- **Estilos**: clases de la landing en la carpeta `client/src/features/landing/` (paleta cálida). Mantén la coherencia del tema en cualquier pantalla nueva.

## Reglas de trabajo

- No inventes librerías: verifica primero que existan en `package.json`.
- Respeta el idioma de las UI y mensajes (español).
- Ante una tarea de diseño, el tema establecido es el de la landing (cream/cacao/naranja + serif en títulos).
- Después de cambios de estructura/código, regenera el grafo de conocimiento si la tarea lo requiere:
  `uvx --from graphifyy graphify update .` y `uvx --from graphifyy graphify cluster-only . --no-label` (ver `docs/graphify.md`).
- Para crear ramas o continuar trabajo: la rama por defecto es `main` (remoto: `https://github.com/Lobitoxxx/MixGustos`, privado).
