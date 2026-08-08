# Grafo de conocimiento con Graphify

[Graphify](https://github.com/safishamsi/graphify) analiza el código del proyecto y genera un **grafo de conocimiento consultable**: nodos = símbolos/archivos, aristas = relaciones (imports, llamadas, contiene, etc.), agrupados en comunidades por afinidad.

## Archivos generados

La salida queda en `graphify-out/` (ignorada por git):

| Archivo | Contenido |
|---|---|
| `graph.json` | El grafo completo (368 nodos, 1017 aristas) |
| `GRAPH_REPORT.md` | Resumen: hubs, comunidades, ciclos, brechas, sugerencias |
| `graph.html` | Visualización interactiva (abrir en el navegador) |
| `.graphify_analysis.json` | Metadatos de extracción |
| `manifest.json` | Manifiesto incremental de Graphify |

## Resumen del grafo actual

- **368 nodos · 1017 aristas · 20 comunidades**
- Extracción: 98% EXTRACTED · 2% INFERRED (16 aristas inferidas, confianza media 0.8)
- Costo de tokens: 0 (extracción local por AST, sin LLM)
- Sin ciclos de importación detectados
- Grafo compilado desde el commit `e3b8c61` (2026-08-08)

### Hubs (abstracciones centrales)

1. `api` — 28 aristas (cliente HTTP del frontend)
2. `moneda()` — 28 aristas (formato de moneda en `lib/format.js`)
3. `Badge()`, `Button()`, `Card()`, `Spinner()`, `Input()` — kit de UI compartido (`components/ui.jsx`)
4. `prisma` — 19 aristas (cliente de BD del backend)
5. `fechaHora()` — 17 aristas (formato de fechas)
6. `useAuth` — 17 aristas (store de autenticación)

### Comunidades destacadas

| Comunidad | Cohesión | Contenido |
|---|---|---|
| 0 | 0.05 | Dependencias del frontend (react, framer-motion, gsap, lucide-react…) |
| 1 | 0.11 | Datos de la landing (`CONTACTO`, `GALERIA`, `PLATOS`, `RECETAS`, `NAV_LINKS`…) |
| 3 | 0.10 | App, rutas, layout y menús por rol (`AppLayout`, `Protected`, `CommandPalette`) |
| 4 | 0.28 | HTTP helpers y middleware (`ok`, `fail`, `auth`, `requirePermiso`) |
| 9 | 0.16 | Rutas del servidor y eventos de socket (`emitPedidoAviso`, `emitConsumoRealizado`) |
| 11 | 0.25 | Motor FEFO/PEPS (`consumirProducto`, `ordenarLotes`, `consumoTeoricoProducto`) |
| 13 | 0.31 | Seguimiento de pedidos: `SeguirMiPedido`, `SeguirPedido`, `PedidosCliente`, `Mesas`, `badgePedido` |
| 15 | 0.36 | Alertas y sugerencia de compras (`detectarAlertas`, `sugerirCompras`, `stockProducto`) |
| 16 | 0.24 | Catálogo de permisos (`PERMISOS_DEFAULT`, `PERMISOS_GENERALES`) |

## Cómo regenerarlo

```bash
# 1. Extracción incremental (solo código, sin API keys)
uvx --from graphifyy graphify update .

# 2. Agrupar comunidades y generar GRAPH_REPORT.md + graph.html
uvx --from graphifyy graphify cluster-only . --no-label
```

> `update` re-extrae únicamente los archivos modificados desde el último grafo y es lo recomendado tras cada cambio.

## Cómo consultarlo

```bash
# Nodos más conectados (arquitectura núcleo)
uvx --from graphifyy graphify god-nodes --top 10 --graph graphify-out/graph.json

# Explicar un nodo y sus vecinos
uvx --from graphifyy graphify explain "SeguirMiPedido" --graph graphify-out/graph.json

# Camino más corto entre dos nodos
uvx --from graphifyy graphify path "api" "badgePedido" --graph graphify-out/graph.json

# Nodos afectados por un cambio (traza inversa)
uvx --from graphifyy graphify affected "consumirProducto" --graph graphify-out/graph.json
```

> Las consultas `explain`, `path`, `affected` y `god-nodes` son determinísticas y no requieren API key. `query "pregunta"` usa BFS sobre el grafo y puede requerir un backend LLM configurado si se pide redacción con contexto.

## Integración con OpenCode

Graphify puede instalar una sección en `AGENTS.md` (y un plugin) para que el agente cargue el grafo automáticamente:

```bash
uvx --from graphifyy graphify opencode install
```
