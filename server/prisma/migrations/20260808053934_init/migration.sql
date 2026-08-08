-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'GERENTE', 'MOZO_SALON', 'MOZO_PUERTA', 'COCINERO', 'ALMACENERO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoPedido" AS ENUM ('MESA', 'PARA_LLEVAR', 'PARA_RECOGER');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('CREADO', 'CONFIRMADO', 'RECIBIDO_COCINA', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'FINALIZADO', 'CANCELADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoItem" AS ENUM ('SOLICITADO', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoMesa" AS ENUM ('LIBRE', 'OCUPADA', 'RESERVADA');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'SALIDA', 'MERMA', 'AJUSTE');

-- CreateEnum
CREATE TYPE "TipoMerma" AS ENUM ('VENCIDO', 'DANADO', 'DESPERDICIADO', 'ERROR_PREPARACION', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoLote" AS ENUM ('ACTIVO', 'AGOTADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoCompra" AS ENUM ('BORRADOR', 'ENVIADA', 'RECIBIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoAlert" AS ENUM ('VENCIDO', 'PROXIMO_VENCER', 'STOCK_MINIMO', 'REPOSICION', 'DIFERENCIA_CONSUMO');

-- CreateEnum
CREATE TYPE "EstadoAlert" AS ENUM ('NUEVA', 'VISTA', 'RESUELTA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "foto" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "preferencias" JSONB,
    "notificaciones" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "permisos" JSONB NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "nombreRestaurante" TEXT NOT NULL DEFAULT 'MixGustos',
    "moneda" TEXT NOT NULL DEFAULT 'S/',
    "igv" DOUBLE PRECISION NOT NULL DEFAULT 0.18,
    "metodoInventario" TEXT NOT NULL DEFAULT 'FEFO',
    "diasProximosVencer" INTEGER NOT NULL DEFAULT 7,
    "umbralDiferencia" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "ruc" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "horarioAtencion" TEXT,
    "politicaFEFO" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "unidad" TEXT NOT NULL DEFAULT 'und',
    "stockMinimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "stockMaximo" DOUBLE PRECISION,
    "costo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioVenta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "esVendible" BOOLEAN NOT NULL DEFAULT false,
    "esPerecedero" BOOLEAN NOT NULL DEFAULT true,
    "imagen" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "descripcion" TEXT,
    "rendimiento" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipeItem" (
    "id" TEXT NOT NULL,
    "recetaId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Table" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nombre" TEXT,
    "capacidad" INTEGER NOT NULL DEFAULT 4,
    "estado" "EstadoMesa" NOT NULL DEFAULT 'LIBRE',

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "tipo" "TipoPedido" NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'CREADO',
    "mesaId" TEXT,
    "clienteNombre" TEXT,
    "telefono" TEXT,
    "observaciones" TEXT,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "observaciones" TEXT,
    "estado" "EstadoItem" NOT NULL DEFAULT 'SOLICITADO',
    "consumido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL,
    "userId" TEXT NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lot" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidadInicial" DOUBLE PRECISION NOT NULL,
    "cantidadActual" DOUBLE PRECISION NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "costoUnitario" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estado" "EstadoLote" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "lotId" TEXT,
    "productoId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "motivo" TEXT,
    "userId" TEXT NOT NULL,
    "orderItemId" TEXT,
    "mermaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Merma" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "tipo" "TipoMerma" NOT NULL,
    "motivo" TEXT,
    "costo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lotId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Merma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consumption" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidadTeorica" DOUBLE PRECISION NOT NULL,
    "cantidadReal" DOUBLE PRECISION NOT NULL,
    "lotId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ruc" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "estado" "EstadoCompra" NOT NULL DEFAULT 'BORRADOR',
    "fechaPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEsperada" TIMESTAMP(3),
    "fechaRecepcion" TIMESTAMP(3),
    "observaciones" TEXT,
    "costoTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidadSolicitada" DOUBLE PRECISION NOT NULL,
    "cantidadRecibida" DOUBLE PRECISION,
    "costoUnitario" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "tipo" "TipoAlert" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "productoId" TEXT,
    "usuarioId" TEXT,
    "estado" "EstadoAlert" NOT NULL DEFAULT 'NUEVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_rol_idx" ON "User"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_rol_key" ON "RolePermission"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "Category_nombre_key" ON "Category"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Product_codigo_key" ON "Product"("codigo");

-- CreateIndex
CREATE INDEX "Product_categoriaId_idx" ON "Product"("categoriaId");

-- CreateIndex
CREATE INDEX "Product_esVendible_idx" ON "Product"("esVendible");

-- CreateIndex
CREATE UNIQUE INDEX "Recipe_productoId_key" ON "Recipe"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeItem_recetaId_ingredienteId_key" ON "RecipeItem"("recetaId", "ingredienteId");

-- CreateIndex
CREATE UNIQUE INDEX "Table_numero_key" ON "Table"("numero");

-- CreateIndex
CREATE INDEX "Table_estado_idx" ON "Table"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Order_codigo_key" ON "Order"("codigo");

-- CreateIndex
CREATE INDEX "Order_estado_idx" ON "Order"("estado");

-- CreateIndex
CREATE INDEX "Order_tipo_idx" ON "Order"("tipo");

-- CreateIndex
CREATE INDEX "Order_mesaId_idx" ON "Order"("mesaId");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderStatusHistory_orderId_idx" ON "OrderStatusHistory"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Lot_codigo_key" ON "Lot"("codigo");

-- CreateIndex
CREATE INDEX "Lot_productoId_idx" ON "Lot"("productoId");

-- CreateIndex
CREATE INDEX "Lot_fechaVencimiento_idx" ON "Lot"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "InventoryMovement_productoId_idx" ON "InventoryMovement"("productoId");

-- CreateIndex
CREATE INDEX "InventoryMovement_lotId_idx" ON "InventoryMovement"("lotId");

-- CreateIndex
CREATE INDEX "InventoryMovement_createdAt_idx" ON "InventoryMovement"("createdAt");

-- CreateIndex
CREATE INDEX "Merma_productoId_idx" ON "Merma"("productoId");

-- CreateIndex
CREATE INDEX "Merma_tipo_idx" ON "Merma"("tipo");

-- CreateIndex
CREATE INDEX "Consumption_productoId_idx" ON "Consumption"("productoId");

-- CreateIndex
CREATE INDEX "Consumption_orderId_idx" ON "Consumption"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_numero_key" ON "PurchaseOrder"("numero");

-- CreateIndex
CREATE INDEX "PurchaseOrder_estado_idx" ON "PurchaseOrder"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrderItem_purchaseOrderId_productoId_key" ON "PurchaseOrderItem"("purchaseOrderId", "productoId");

-- CreateIndex
CREATE INDEX "Alert_estado_idx" ON "Alert"("estado");

-- CreateIndex
CREATE INDEX "Alert_tipo_idx" ON "Alert"("tipo");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Recipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeItem" ADD CONSTRAINT "RecipeItem_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lot" ADD CONSTRAINT "Lot_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_mermaId_fkey" FOREIGN KEY ("mermaId") REFERENCES "Merma"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merma" ADD CONSTRAINT "Merma_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merma" ADD CONSTRAINT "Merma_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Merma" ADD CONSTRAINT "Merma_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
