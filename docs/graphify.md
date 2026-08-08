# Grafo de conocimiento con Graphify

[Graphify](https://github.com/safishamsi/graphify) analiza el código del proyecto y genera un **grafo de conocimiento consultable**: nodos = símbolos/archivos, aristas = relaciones (imports, llamadas, contiene, etc.), agrupados en comunidades por afinidad.

## Archivos generados

La salida queda en `graphify-out/`:

| Archivo | Contenido |
|---|---|
| `graph.json` | El grafo completo (305 nodos, 892 aristas) |
| `GRAPH_REPORT.md` | Resumen: hubs, dios-nodos, comunidades, ciclos, brechas |
| `graph.html` | Visualización interactiva (abrir en el navegador) |
| `.graphify_analysis.json` | Metadatos de extracción |
| `manifest.json` | Manifiesto incremental de Graphify |

## Resumen del grafo actual

- **305 nodos · 892 aristas · 13 comunidades**
- Extracción: 98% EXTRACTED · 2% INFERRED (16 aristas inferidas, confianza media 0.8)
- Costo de tokens: 0 (extracción local por AST, sin LLM)
- Sin ciclos de importación detectados

### Hubs (abstracciones centrales)

1. `api` — 26 aristas (cliente HTTP del frontend)
2. `moneda()` — 26 aristas (formato de moneda en `lib/format.js`)
3. `Spinner()`, `Card()`, `Badge()`, `Button()`, `Input()`, `Empty()` — kit de UI compartido
4. `prisma` — 19 aristas (cliente de BD del backend)
5. `fechaHora()` — 16 aristas (formato de fechas)

### Comunidades destacadas

| Comunidad | Cohesión | Contenido |
|---|---|---|
| 0 | 0.13 | Kit de UI y utilidades del cliente |
| 1 | 0.08 | App, rutas, layout y menús por rol |
| 3 | 0.09 | Servidor Express: app, server, middlewares, rutas |
| 5 | 0.28 | Middleware de auth y permisos (`auth`, `requirePermiso`) |
| 7 | 0.28 | Motor FEFO/PEPS (`consumirProducto`, `ordenarLotes`, `ordenFEFO`) |
| 8 | 0.28 | Alertas y sugerencia de compras (`detectarAlertas`, `sugerirCompras`) |
| 9 | 0.33 | Catálogo de permisos (`PERMISOS_DEFAULT`, `PERMISOS_GENERALES`) |

## Cómo regenerarlo

```bash
# 1. Extraer el grafo (solo código, sin API keys)
uvx --from graphifyy graphify extract . --code-only

# 2. Agrupar comunidades y generar GRAPH_REPORT.md + graph.html
uvx --from graphifyy graphify cluster-only . --no-label
```

## Cómo consultarlo

```bash
# Nodos más conectados (arquitectura núcleo)
uvx --from graphifyy graphify god-nodes --top 10 --graph graphify-out/graph.json

# Explicar un nodo y sus vecinos
uvx --from graphifyy graphify explain "consumirProducto" --graph graphify-out/graph.json

# Camino más corto entre dos nodos
uvx --from graphifyy graphify path "api" "fechaHora" --graph graphify-out/graph.json

# Nodos afectados por un cambio (traza inversa)
uvx --from graphifyy graphify affected "consumirProducto" --graph graphify-out/graph.json
```

> Las consultas `explain`, `path`, `affected` y `god-nodes` son determinísticas y no requieren API key. `query "pregunta"` usa BFS sobre el grafo y puede requerir un backend LLM configurado si se pide redacción con contexto.

## Opcional: integrar Graphify con OpenCode

```bash
uvx --from graphifyy graphify opencode install
```

Escribe una sección en `AGENTS.md` (y un plugin) para que el agente cargue el grafo automáticamente.
