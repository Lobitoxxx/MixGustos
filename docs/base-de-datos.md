# Base de datos

PostgreSQL 16 (contenedor Docker `mixgustos_db`) con ORM **Prisma 6**. Esquema en `server/prisma/schema.prisma`; migraciones en `server/prisma/migrations`.

Conexión (dev): `postgresql://mixgustos:mixgustos_dev@localhost:5432/mixgustos?schema=public`

## Diagrama entidad-relación

```mermaid
erDiagram
    User ||--o{ Order : "crea/atendido"
    User ||--o{ InventoryMovement : "registra"
    User ||--o{ Merma : "registra"
    User ||--o{ PurchaseOrder : "crea"
    User ||--o{ Alert : "destinatario"
    User ||--o{ OrderStatusHistory : "cambia"
    RolePermission ||--|| User : "permisos por rol"

    Category ||--o{ Product : "categoriza"
    Product ||--o| Recipe : "es vendible"
    Recipe ||--o{ RecipeItem : "incluye"
    Product ||--o{ RecipeItem : "ingrediente"
    Product ||--o{ Lot : "se lotifica"
    Product ||--o{ InventoryMovement : "se mueve"
    Product ||--o{ Merma : "se pierde"
    Product ||--o{ PurchaseOrderItem : "se compra"
    Product ||--o{ Consumption : "se consume"
    Product ||--o{ Alert : "genera"
    Product ||--o{ OrderItem : "se vende"

    Table ||--o{ Order : "mesa"
    Order ||--o{ OrderItem : "tiene"
    Order ||--o{ OrderStatusHistory : "registra"
    Order ||--o{ Consumption : "origina"
    OrderItem ||--o{ Consumption : "consume"
    OrderItem ||--o{ InventoryMovement : "descuenta"

    Lot ||--o{ InventoryMovement : "afecta"
    Lot ||--o{ Merma : "merma"
    Merma ||--o{ InventoryMovement : "registra"

    Supplier ||--o{ PurchaseOrder : "provee"
    PurchaseOrder ||--o{ PurchaseOrderItem : "incluye"
```

## Enumerados

| Enum | Valores |
|---|---|
| `Rol` | ADMINISTRADOR, GERENTE, MOZO_SALON, MOZO_PUERTA, COCINERO, ALMACENERO, CLIENTE |
| `TipoPedido` | MESA, PARA_LLEVAR, PARA_RECOGER |
| `EstadoPedido` | CREADO, CONFIRMADO, RECIBIDO_COCINA, EN_PREPARACION, LISTO, ENTREGADO, FINALIZADO, CANCELADO, RECHAZADO |
| `EstadoItem` | SOLICITADO, EN_PREPARACION, LISTO, ENTREGADO, CANCELADO |
| `EstadoMesa` | LIBRE, OCUPADA, RESERVADA |
| `TipoMovimiento` | ENTRADA, SALIDA, MERMA, AJUSTE |
| `TipoMerma` | VENCIDO, DANADO, DESPERDICIADO, ERROR_PREPARACION, OTRO |
| `EstadoLote` | ACTIVO, AGOTADO, VENCIDO |
| `EstadoCompra` | BORRADOR, ENVIADA, RECIBIDA, CANCELADA |
| `TipoAlert` | VENCIDO, PROXIMO_VENCER, STOCK_MINIMO, REPOSICION, DIFERENCIA_CONSUMO |
| `EstadoAlert` | NUEVA, VISTA, RESUELTA |

## Modelos principales

### Usuarios, roles y configuración
- **User**: username/email únicos, password (bcrypt), rol, activo, foto, preferencias y notificaciones (JSON).
- **RolePermission**: una fila por rol con la lista de permisos (JSON).
- **Setting**: configuración global del restaurante (nombre, moneda, IGV, método de inventario FEFO/PEPS, días para "próximo a vencer", umbral de diferencia, datos fiscales).

### Catálogo
- **Category**: nombre único, descripción, orden.
- **Product**: código único, categoría, unidad, stock mínimo/máximo, costo y precio, `esVendible`, `esPerecedero`, imagen, activo.
- **Recipe** (una por producto vendible): rendimiento y **RecipeItem** (ingrediente + cantidad), con clave única `(recetaId, ingredienteId)`.

### Operación
- **Table**: número único, nombre, capacidad, estado (LIBRE/OCUPADA/RESERVADA).
- **Order**: código único (legible), tipo, estado, mesa opcional, cliente (nombre/teléfono), observaciones, `createdById` y `assignedToId` (mozo/cocina), total.
- **OrderItem**: producto, cantidad, precio congelado, observaciones, estado del ítem, flag `consumido` (evita doble descuento de inventario).
- **OrderStatusHistory**: traza de cada cambio de estado (quién, cuándo, comentario).

### Almacén
- **Lot**: código único, producto, `cantidadInicial`/`cantidadActual`, fechas de ingreso y vencimiento, costo unitario, estado (ACTIVO/AGOTADO/VENCIDO). El stock del producto es la suma de sus lotes activos.
- **InventoryMovement**: movimiento de inventario (ENTRADA/SALIDA/MERMA/AJUSTE) ligado a lote, producto, usuario y opcionalmente a `orderItem`/`merma`.
- **Merma**: producto, cantidad, tipo, motivo, costo, lote opcional.
- **Consumption**: por ítem de pedido, `cantidadTeorica` (receta × cantidad) vs `cantidadReal` (descontada de lotes), con lote de origen.

### Compras
- **Supplier**: razón social, RUC, contacto, activo.
- **PurchaseOrder**: número único, proveedor, estado (BORRADOR/ENVIADA/RECIBIDA/CANCELADA), fechas, observaciones, costo total, usuario.
- **PurchaseOrderItem**: producto, cantidad solicitada/recibida, costo unitario, clave única `(purchaseOrderId, productoId)`.

### Alertas
- **Alert**: tipo, título, mensaje, producto y usuario opcionales, estado (NUEVA/VISTA/RESUELTA).

## Índices y consistencia

- Índices en columnas de filtro frecuente: `Product.categoriaId`, `Product.esVendible`, `Order.estado/tipo/mesaId`, `OrderItem.orderId`, `Lot.productoId/fechaVencimiento`, `InventoryMovement.productoId/lotId/createdAt`, `Merma.productoId/tipo`, `PurchaseOrder.estado`, `Alert.estado/tipo`.
- Unicidades: `User.username`, `User.email`, `Category.nombre`, `Product.codigo`, `Table.numero`, `Order.codigo`, `Lot.codigo`, `PurchaseOrder.numero`, `RolePermission.rol`, `Recipe.productoId`.
- La clave foránea de `RolePermission.rol` no referencia una tabla (es un enum), por lo que los permisos se asocian por valor de rol.
