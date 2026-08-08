import { prisma } from '../lib/prisma.js';

const DECIMAL_PRECISION = 0.000001;

export function round(n) {
  return Math.round((n + Number.EPSILON) * 1000000) / 1000000;
}

// ------------------------------------------------------------
// Ordenamiento de lotes segun metodologia
// ------------------------------------------------------------

// FEFO: primero el que vence primero. Desempate: el que ingreso primero.
export function ordenFEFO(lotes) {
  return [...lotes].sort((a, b) => {
    const av = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity;
    const bv = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity;
    if (av !== bv) return av - bv;
    return new Date(a.fechaIngreso) - new Date(b.fechaIngreso);
  });
}

// PEPS: primero el que ingreso primero. Desempate: vencimiento.
export function ordenPEPS(lotes) {
  return [...lotes].sort((a, b) => {
    const ai = new Date(a.fechaIngreso).getTime();
    const bi = new Date(b.fechaIngreso).getTime();
    if (ai !== bi) return ai - bi;
    const av = a.fechaVencimiento ? new Date(a.fechaVencimiento).getTime() : Infinity;
    const bv = b.fechaVencimiento ? new Date(b.fechaVencimiento).getTime() : Infinity;
    return av - bv;
  });
}

export async function getMetodoProducto(productoId) {
  const producto = await prisma.product.findUnique({ where: { id: productoId } });
  const setting = await prisma.setting.findFirst();
  const base = setting?.metodoInventario || 'FEFO';
  if (producto?.esPerecedero === false) return 'PEPS';
  return base;
}

export function ordenarLotes(lotes, metodo) {
  return metodo === 'PEPS' ? ordenPEPS(lotes) : ordenFEFO(lotes);
}

// ------------------------------------------------------------
// Stock
// ------------------------------------------------------------

export async function stockProducto(productoId) {
  const aggr = await prisma.lot.aggregate({
    where: { productoId, estado: { in: ['ACTIVO'] } },
    _sum: { cantidadActual: true },
  });
  return round(aggr._sum.cantidadActual || 0);
}

export async function stockPorLotes(productoId) {
  return prisma.lot.findMany({
    where: { productoId },
    orderBy: [{ fechaVencimiento: 'asc' }, { fechaIngreso: 'asc' }],
  });
}

// ------------------------------------------------------------
// Entradas
// ------------------------------------------------------------

export async function registrarEntrada({
  productoId,
  cantidad,
  fechaIngreso = new Date(),
  fechaVencimiento = null,
  costoUnitario = 0,
  userId,
  lotId = null,
  motivo = 'Entrada de inventario',
}) {
  if (cantidad <= 0) throw Object.assign(new Error('La cantidad debe ser mayor a cero'), { status: 400 });

  let lot;
  if (lotId) {
    lot = await prisma.lot.update({
      where: { id: lotId },
      data: { cantidadActual: { increment: cantidad }, estado: 'ACTIVO' },
    });
  } else {
    const last = await prisma.lot.findFirst({
      where: { productoId },
      orderBy: { createdAt: 'desc' },
    });
    const numero = last ? parseInt(last.codigo.replace(/\D+/g, ''), 10) + 1 : 1;
    lot = await prisma.lot.create({
      data: {
        codigo: `L-${productoId.slice(0, 4).toUpperCase()}-${String(numero).padStart(4, '0')}`,
        productoId,
        cantidadInicial: cantidad,
        cantidadActual: cantidad,
        fechaIngreso,
        fechaVencimiento,
        costoUnitario,
        estado: 'ACTIVO',
      },
    });
  }

  const movement = await prisma.inventoryMovement.create({
    data: {
      lotId: lot.id,
      productoId,
      tipo: 'ENTRADA',
      cantidad,
      motivo,
      userId,
    },
  });

  return { lot, movement };
}

// ------------------------------------------------------------
// Salidas (FEFO / PEPS)
// ------------------------------------------------------------

/**
 * Consume `cantidad` del producto saliendo de los lotes en el orden
 * determinado por la metodologia (FEFO prioritario en perecederos, PEPS
 * complementario). Genera movimientos de SALIDA por lote y actualiza
 * cantidades y estados de lote.
 */
export async function consumirProducto({
  productoId,
  cantidad,
  userId,
  orderItemId = null,
  motivo = 'Consumo',
}) {
  if (cantidad <= 0) return [];

  const metodo = await getMetodoProducto(productoId);
  const lotes = await prisma.lot.findMany({
    where: { productoId, estado: { in: ['ACTIVO'] }, cantidadActual: { gt: 0 } },
  });

  const ordenados = ordenarLotes(lotes, metodo);
  let restante = round(cantidad);
  const movimientos = [];

  for (const lot of ordenados) {
    if (restante <= 0) break;
    const disponible = round(lot.cantidadActual);
    if (disponible <= 0) continue;
    const salida = round(Math.min(disponible, restante));

    await prisma.lot.update({
      where: { id: lot.id },
      data: {
        cantidadActual: round(disponible - salida),
        estado: round(disponible - salida) <= DECIMAL_PRECISION ? 'AGOTADO' : 'ACTIVO',
      },
    });

    const movement = await prisma.inventoryMovement.create({
      data: {
        lotId: lot.id,
        productoId,
        tipo: 'SALIDA',
        cantidad: salida,
        motivo,
        userId,
        orderItemId,
      },
    });
    movimientos.push({ movement, lot, cantidad: salida, metodo });
    restante = round(restante - salida);
  }

  if (restante > DECIMAL_PRECISION) {
    throw Object.assign(
      new Error(`Stock insuficiente de producto para consumir (faltan ${restante} unidades)`),
      { status: 409 }
    );
  }

  return movimientos;
}

// ------------------------------------------------------------
// Mermas
// ------------------------------------------------------------

export async function registrarMerma({ productoId, cantidad, tipo, motivo, userId, lotId = null }) {
  const costo = (await prisma.product.findUnique({ where: { id: productoId } }))?.costo || 0;

  // Si no se indica lote, sale del primer lote disponible segun metodo.
  let lotElegido = lotId;
  if (!lotElegido) {
    const metodo = await getMetodoProducto(productoId);
    const lotes = await prisma.lot.findMany({
      where: { productoId, estado: 'ACTIVO', cantidadActual: { gt: 0 } },
    });
    const lotesOrdenados = ordenarLotes(lotes, metodo);
    lotElegido = lotesOrdenados[0]?.id || null;
  }

  let salida = 0;
  if (lotElegido) {
    const lot = await prisma.lot.update({
      where: { id: lotElegido },
      data: {
        cantidadActual: { decrement: cantidad },
        ...(lotId ? {} : {}),
      },
    });
    if (lot.cantidadActual <= DECIMAL_PRECISION) {
      await prisma.lot.update({ where: { id: lotElegido }, data: { estado: 'AGOTADO' } });
    }
    salida = cantidad;
  }

  const merma = await prisma.merma.create({
    data: {
      productoId,
      cantidad,
      tipo,
      motivo,
      costo: costo * cantidad,
      lotId: lotElegido,
      userId,
    },
    include: { producto: true, user: { select: { nombre: true } } },
  });

  const movement = await prisma.inventoryMovement.create({
    data: {
      lotId: lotElegido,
      productoId,
      tipo: 'MERMA',
      cantidad: salida || cantidad,
      motivo: `${tipo}${motivo ? ' - ' + motivo : ''}`,
      userId,
      mermaId: merma.id,
    },
  });

  return { merma, movement };
}

// ------------------------------------------------------------
// Consumo de pedido -> receta -> ingredientes -> FEFO/PEPS
// ------------------------------------------------------------

/**
 * Cuando un item del pedido llega a LISTO, se calcula el consumo teorico
 * de sus ingredientes (receta x cantidad) y se descuenta del almacen.
 */
export async function procesarConsumoItem(orderItemId) {
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: {
      order: true,
      producto: true,
    },
  });
  if (!item || item.consumido) return { item, consumptions: [], error: 'Ya consumido' };

  const recipe = await prisma.recipe.findUnique({
    where: { productoId: item.productoId },
    include: { items: { include: { ingrediente: true } } },
  });

  const consumptions = [];
  if (recipe && recipe.items.length > 0) {
    for (const ri of recipe.items) {
      const cantidadTeorica = round(ri.cantidad * item.cantidad);
      try {
        const movimientos = await consumirProducto({
          productoId: ri.ingredienteId,
          cantidad: cantidadTeorica,
          userId: item.order.createdById,
          orderItemId: item.id,
          motivo: `Consumo ${item.producto.nombre} (${item.order.codigo})`,
        });
        for (const mv of movimientos) {
          consumptions.push(
            await prisma.consumption.create({
              data: {
                orderItemId: item.id,
                orderId: item.orderId,
                productoId: ri.ingredienteId,
                cantidadTeorica,
                cantidadReal: mv.cantidad,
                lotId: mv.lot.id,
              },
            })
          );
        }
      } catch (e) {
        console.warn(`Stock insuficiente de ingrediente ${ri.ingrediente.nombre}: ${e.message}`);
      }
    }
  }

  await prisma.orderItem.update({ where: { id: item.id }, data: { consumido: true } });
  return { item, consumptions };
}

// ------------------------------------------------------------
// Consumo teorico vs real
// ------------------------------------------------------------

export async function consumoTeoricoProducto(productoId, desde, hasta) {
  const items = await prisma.orderItem.findMany({
    where: {
      consumido: true,
      order: {
        createdAt: { gte: desde || new Date(0), lte: hasta || new Date() },
        estado: { in: ['ENTREGADO', 'FINALIZADO', 'LISTO'] },
      },
      producto: { recipeFor: { isNot: null } },
    },
    include: { order: true },
  });

  let totalTeorico = 0;
  for (const item of items) {
    const recipe = await prisma.recipe.findUnique({
      where: { productoId: item.productoId },
      include: { items: true },
    });
    if (!recipe) continue;
    const ri = recipe.items.find((x) => x.ingredienteId === productoId);
    if (ri) totalTeorico += ri.cantidad * item.cantidad;
  }

  const aggrReal = await prisma.inventoryMovement.aggregate({
    where: {
      productoId,
      tipo: { in: ['SALIDA'] },
      createdAt: { gte: desde || new Date(0), lte: hasta || new Date() },
      orderItemId: { not: null },
    },
    _sum: { cantidad: true },
  });

  const real = round(aggrReal._sum.cantidad || 0);
  const teorico = round(totalTeorico);
  return {
    productoId,
    teorico,
    real,
    diferencia: round(real - teorico),
  };
}
