# API REST

Base URL: `http://localhost:4000/api` (en dev el cliente la consume vía proxy de Vite).

Formato de respuesta de error: `{ "error": "mensaje" }`. Autenticación: cabecera `Authorization: Bearer <token>` salvo lo indicado como público.

El permiso `ADMINISTRADOR` salta siempre el control de permisos. El resto de roles debe tener el permiso listado en su `RolePermission`.

## Autenticación (`/api/auth`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público | Inicia sesión (`{ usuario, password }`) → `{ token, user }` |
| GET | `/auth/me` | Autenticado | Devuelve el usuario de la sesión |

## Usuarios y permisos (`/api/users`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/users` | `usuarios.gestionar` | Lista de usuarios |
| POST | `/users` | `usuarios.gestionar` | Crea usuario |
| PUT | `/users/:id` | `usuarios.gestionar` | Actualiza usuario |
| PATCH | `/users/:id/estado` | `usuarios.gestionar` | Activa/desactiva |
| GET | `/users/roles/permisos` | `permisos.gestionar` | Permisos por rol |
| PUT | `/users/roles/permisos/:rol` | `permisos.gestionar` | Guarda permisos de un rol |

## Perfil (`/api/perfil`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/perfil` | Autenticado | Datos del propio usuario |
| PUT | `/perfil` | Autenticado | Actualiza nombre, teléfono, foto, preferencias, notificaciones |
| PUT | `/perfil/password` | Autenticado | Cambia contraseña (valida la anterior) |

## Catálogo (`/api/catalog`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/catalog/categories` | Autenticado | Categorías |
| POST | `/catalog/categories` | `catalogo.gestionar` | Crea categoría |
| PUT | `/catalog/categories/:id` | `catalogo.gestionar` | Actualiza categoría |
| DELETE | `/catalog/categories/:id` | `catalogo.gestionar` | Elimina categoría |
| GET | `/catalog/products` | Autenticado | Productos (filtros: `categoriaId`, `vendible`, `q`) |
| GET | `/catalog/products/:id` | Autenticado | Detalle de producto |
| POST | `/catalog/products` | `catalogo.gestionar` | Crea producto |
| PUT | `/catalog/products/:id` | `catalogo.gestionar` | Actualiza producto |
| DELETE | `/catalog/products/:id` | `catalogo.gestionar` | Elimina producto |
| GET | `/catalog/recipes` | Autenticado | Recetas con ingredientes |
| POST | `/catalog/recipes` | `recetas.gestionar` | Crea/actualiza receta (items) |
| DELETE | `/catalog/recipes/:id` | `recetas.gestionar` | Elimina receta |

## Mesas (`/api/tables`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/tables` | `mesas.ver` | Mesas |
| POST | `/tables` | `mesas.gestionar` | Crea mesa |
| PUT | `/tables/:id` | `mesas.gestionar` | Actualiza mesa |
| PATCH | `/tables/:id/estado` | `mesas.gestionar` | Cambia estado |
| DELETE | `/tables/:id` | `mesas.gestionar` | Elimina mesa |

## Pedidos (`/api/orders`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/orders` | `pedidos.ver` | Pedidos (filtros: estado, tipo, mesa, fecha) |
| GET | `/orders/:id` | `pedidos.ver` | Detalle con ítems e historial |
| POST | `/orders` | `pedidos.crear` | Crea pedido (tipo MESA/PARA_LLEVAR/PARA_RECOGER + ítems) |
| PUT | `/orders/:id` | `pedidos.modificar` | Modifica pedido no confirmado |
| POST | `/orders/:id/confirmar` | `pedidos.confirmar` | Confirma y emite `pedido:nuevo` a cocina |
| POST | `/orders/:id/cancelar` | `pedidos.cancelar` | Cancela (libera mesa) |
| POST | `/orders/:id/entregar` | `pedidos.entregar` | Entrega al cliente |
| POST | `/orders/:id/finalizar` | `pedidos.entregar` | Finaliza y libera mesa |

## Cocina (`/api/kitchen`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/kitchen/orders` | Autenticado | Pedidos activos (CONFIRMADO→LISTO) agrupados |
| POST | `/kitchen/orders/:id/recibir` | `cocina.gestionar` | RECIBIDO_COCINA |
| POST | `/kitchen/orders/:id/preparar` | `cocina.gestionar` | EN_PREPARACION (ítems) |
| POST | `/kitchen/orders/:id/listo` | `cocina.gestionar` | Marca ítems LISTO y **descuenta insumos por receta (FEFO/PEPS)** |

## Almacén (`/api/warehouse`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/warehouse/inventory` | `inventario.ver` | Inventario por producto con detalle de lotes |
| GET | `/warehouse/movements` | `inventario.ver` | Movimientos (paginados) |
| GET | `/warehouse/lots` | `lotes.ver` | Lotes |
| GET | `/warehouse/lots/fefo` | `lotes.ver` | Orden sugerido FEFO (`?productoId=`) |
| GET | `/warehouse/lots/peps` | `lotes.ver` | Orden sugerido PEPS |
| POST | `/warehouse/lots` | `lotes.gestionar` | Crea lote manual |
| POST | `/warehouse/entradas` | `inventario.gestionar` | Entrada (crea lote o suma cantidad) |
| POST | `/warehouse/salidas` | `inventario.gestionar` | Salida manual |
| POST | `/warehouse/mermas` | `inventario.gestionar` | Registra merma |
| POST | `/warehouse/ajustar` | `inventario.gestionar` | Ajuste de inventario |
| GET | `/warehouse/proximos-vencer` | `inventario.ver` | Lotes próximos a vencer |
| GET | `/warehouse/vencidos` | `inventario.ver` | Lotes vencidos |
| GET | `/warehouse/metodo/:productoId` | `inventario.ver` | Lotes aplicando método configurado |

## Compras (`/api/purchases`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/purchases/suppliers` | `proveedores.ver` | Proveedores |
| POST | `/purchases/suppliers` | `proveedores.gestionar` | Crea proveedor |
| PUT | `/purchases/suppliers/:id` | `proveedores.gestionar` | Actualiza proveedor |
| DELETE | `/purchases/suppliers/:id` | `proveedores.gestionar` | Elimina proveedor |
| GET | `/purchases/orders` | `compras.ver` | Órdenes de compra |
| POST | `/purchases/orders` | `compras.gestionar` | Crea orden (borrador) |
| POST | `/purchases/orders/:id/enviar` | `compras.gestionar` | Marca ENVIADA |
| POST | `/purchases/orders/:id/cancelar` | `compras.gestionar` | Cancela |
| POST | `/purchases/orders/:id/recepcion` | `compras.gestionar` | Recepción: crea lotes, movimientos ENTRADA y suma stock |
| GET | `/purchases/sugerencia` | `compras.gestionar` | Sugerencia de compra por stock mínimo |

## Reportes (`/api/reports`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/reports/ventas` | Autenticado | Ventas por rango (`?desde=&hasta=`) |
| GET | `/reports/mas-vendidos` | Autenticado | Ranking de platos |
| GET | `/reports/consumo` | Autenticado | Consumo teórico vs real por insumo |
| GET | `/reports/consumo/diferencias` | Autenticado | Diferencias de consumo |
| GET | `/reports/mermas` | Autenticado | Mermas por tipo y costo |
| GET | `/reports/inventario` | Autenticado | Valorización de inventario |
| GET | `/reports/rotacion` | Autenticado | Rotación de insumos |
| GET | `/reports/compras` | Autenticado | Compras por proveedor/rango |
| GET | `/reports/operacion` | Autenticado | Resumen operativo del día/rango |

## Dashboard (`/api/dashboard`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/dashboard` | Autenticado | KPIs: ventas hoy, pedidos, tickets promedio, insumos críticos, gráficos |

## Alertas (`/api/alerts`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/alerts` | `almacen.ver` | Alertas (filtro estado) |
| POST | `/alerts/check` | `almacen.gestionar` | Regenera alertas manualmente |
| PATCH | `/alerts/:id` | `almacen.ver` | Marca vista/resuelta |

## Configuración (`/api/settings`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/settings` | Autenticado | Configuración del restaurante |
| PUT | `/settings` | `configuracion.gestionar` | Guarda configuración (incluye método FEFO/PEPS) |

## Portal cliente (`/api/client`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/client/menu` | Público | Menú activo con categorías |
| GET | `/client/tables` | Público | Mesas libres |
| GET | `/client/orders/:codigo` | Público | Estado de un pedido por código |
| POST | `/client/orders` | rol CLIENTE | Crea pedido desde el portal |
| GET | `/client/orders` | rol CLIENTE | Pedidos del cliente |

## Utilidades

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Health check `{ ok: true, servicio: "MixGustos API" }` |

## Ejemplo de petición

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario":"mzsalon","password":"123456"}'

# Pedido con token
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"MESA","mesaId":"<id>","items":[{"productoId":"<id>","cantidad":2}]}'
```
