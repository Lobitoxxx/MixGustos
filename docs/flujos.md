# Flujos del negocio

## 1. Ciclo de vida de un pedido

```mermaid
stateDiagram-v2
    [*] --> CREADO
    CREADO --> CONFIRMADO : mozo confirma
    CREADO --> CANCELADO : mozo cancela
    CONFIRMADO --> RECIBIDO_COCINA : cocina recibe
    CONFIRMADO --> RECHAZADO : cocina rechaza
    RECIBIDO_COCINA --> EN_PREPARACION : cocina prepara
    EN_PREPARACION --> LISTO : ítems listos (descuento FEFO/PEPS)
    LISTO --> ENTREGADO : mozo entrega al cliente
    ENTREGADO --> FINALIZADO : mozo cobra y cierra
    CANCELADO --> [*]
    RECHAZADO --> [*]
    FINALIZADO --> [*]
```

Secuencia completa (salón):

```mermaid
sequenceDiagram
    participant M as Mozo de salón
    participant API as API
    participant CO as Cocinero
    participant AL as Almacén (FEFO/PEPS)

    M->>API: POST /orders {tipo: MESA, items}
    API-->>M: 201 pedido CREADO + mesa OCUPADA
    M->>API: POST /orders/:id/confirmar
    API-->>CO: socket pedido:nuevo
    CO->>API: POST /kitchen/orders/:id/recibir
    API-->>CO: RECIBIDO_COCINA (socket pedido:estado)
    CO->>API: POST /kitchen/orders/:id/preparar
    API-->>CO: EN_PREPARACION
    CO->>API: POST /kitchen/orders/:id/listo
    Note over API,AL: por cada ítem LISTO se descuentan insumos<br/>de la receta con FEFO/PEPS una sola vez
    API->>AL: consumir (lotes) → SALIDA + Consumption
    API-->>M: socket pedido:listo
    M->>API: POST /orders/:id/entregar
    M->>API: POST /orders/:id/finalizar
    API-->>M: FINALIZADO + mesa LIBRE
```

## 2. Consumo de insumos y FEFO/PEPS

Cuando un ítem se marca como **listo**, el motor `services/fefoPeps.js` descuenta el inventario según la receta del plato y el método de inventario configurado.

```mermaid
flowchart TD
    A[Ítem del pedido marcado LISTO] --> B{¿consumido ya?}
    B -->|sí| Z[ignorar - evita doble descuento]
    B -->|no| C[leer receta del producto]
    C --> D[por cada ingrediente de la receta<br/>cantidad = cantidadReceta × cantidadÍtem]
    D --> E{método de inventario?}
    E -->|FEFO| F[ordenar lotes ACTIVOS por fechaVencimiento asc]
    E -->|PEPS| G[ordenar lotes ACTIVOS por fechaIngreso asc]
    F --> H[descontar cantidadActual de lotes en orden]
    G --> H
    H --> I[crear movimientos SALIDA por lote]
    I --> J[registrar Consumption<br/>cantidadTeorica vs cantidadReal]
    J --> K[crear alertas de diferencia si supera umbral]
    J --> L[emitir consumo:realizado por socket]
```

## 3. Compras y recepción de mercadería

```mermaid
sequenceDiagram
    participant AL as Almacenero
    participant API as API
    participant DB as Base de datos

    AL->>API: GET /purchases/sugerencia
    API-->>AL: insumos bajo stock mínimo
    AL->>API: POST /purchases/orders {proveedorId, items}
    API-->>AL: orden BORRADOR
    AL->>API: POST /purchases/orders/:id/enviar
    API-->>AL: ENVIADA
    AL->>API: POST /purchases/orders/:id/recepcion {cantidades recibidas}
    API->>DB: crear/actualizar lotes (vencimiento, costo unitario)
    API->>DB: movimientos ENTRADA + suma de stock
    API-->>AL: RECIBIDA + total actualizado
```

## 4. Alertas automáticas

El servicio `services/alertas.js` corre cada 5 minutos (y al arrancar el servidor, o a demanda con `POST /api/alerts/check`).

```mermaid
flowchart TD
    A[detectarAlertas] --> B[Lotes vencidos → VENCIDO]
    A --> C[Lotes con vencimiento en N días → PROXIMO_VENCER]
    A --> D[Productos con stock actual < stockMinimo → STOCK_MINIMO]
    A --> E[Insumos críticos sin stock → REPOSICION]
    A --> F[Diferencias consumo teórico vs real > umbral → DIFERENCIA_CONSUMO]
    B & C & D & E & F --> G[crear Alert NUEVA si no existe igual pendiente]
    G --> H[emitir alerta:nueva a ALMACENERO / GERENTE / ADMIN]
    H --> I[el usuario marca VISTA o RESUELTA]
```

## 5. Portal del cliente

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as API
    participant M as Mozo / Cocina

    C->>API: GET /client/menu (público)
    C->>API: POST /client/orders (rol CLIENTE)
    C->>API: GET /client/orders/:codigo (público)
    API-->>C: estado actual + historial
    Note over M,API: los cambios de estado en salón/cocina<br/>se reflejan en tiempo real
```
