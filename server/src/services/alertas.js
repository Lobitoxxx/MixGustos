import { prisma } from '../lib/prisma.js';
import { emitAlerta } from '../socket/index.js';
import { stockProducto, round } from './fefoPeps.js';

export async function getSettings() {
  let setting = await prisma.setting.findFirst();
  if (!setting) {
    setting = await prisma.setting.create({ data: {} });
  }
  return setting;
}

async function upsertAlert({ tipo, titulo, mensaje, productoId = null, usuarioId = null }) {
  const existing = await prisma.alert.findFirst({
    where: { tipo, productoId: productoId || null, estado: { in: ['NUEVA', 'VISTA'] } },
  });
  if (existing) return existing;
  const alerta = await prisma.alert.create({ data: { tipo, titulo, mensaje, productoId, usuarioId } });
  emitAlerta(alerta);
  return alerta;
}

// ------------------------------------------------------------
// Deteccion de alertas
// ------------------------------------------------------------

export async function detectarAlertas() {
  const setting = await getSettings();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const enXDias = new Date(hoy);
  enXDias.setDate(enXDias.getDate() + (setting.diasProximosVencer || 7));
  const creadas = [];

  const lotes = await prisma.lot.findMany({
    where: { estado: { in: ['ACTIVO'] }, cantidadActual: { gt: 0 } },
    include: { producto: true },
  });

  for (const lot of lotes) {
    if (lot.fechaVencimiento && lot.fechaVencimiento < hoy) {
      creadas.push(
        await upsertAlert({
          tipo: 'VENCIDO',
          titulo: 'Producto vencido',
          mensaje: `El lote ${lot.codigo} de ${lot.producto.nombre} vencio el ${lot.fechaVencimiento.toLocaleDateString()}. Quedan ${lot.cantidadActual} ${lot.producto.unidad}.`,
          productoId: lot.productoId,
        })
      );
      await prisma.lot.update({ where: { id: lot.id }, data: { estado: 'VENCIDO' } });
    } else if (
      lot.fechaVencimiento &&
      lot.fechaVencimiento >= hoy &&
      lot.fechaVencimiento <= enXDias
    ) {
      creadas.push(
        await upsertAlert({
          tipo: 'PROXIMO_VENCER',
          titulo: 'Producto proximo a vencer',
          mensaje: `El lote ${lot.codigo} de ${lot.producto.nombre} vencera el ${lot.fechaVencimiento.toLocaleDateString()}.`,
          productoId: lot.productoId,
        })
      );
    }
  }

  const productos = await prisma.product.findMany({ where: { activo: true } });
  for (const p of productos) {
    const stock = await stockProducto(p.id);
    if (p.stockMinimo > 0 && stock <= p.stockMinimo) {
      creadas.push(
        await upsertAlert({
          tipo: 'STOCK_MINIMO',
          titulo: 'Stock minimo alcanzado',
          mensaje: `${p.nombre} tiene ${stock} ${p.unidad} (minimo ${p.stockMinimo}).`,
          productoId: p.id,
        })
      );
    }
  }

  const sugerencias = await sugerirCompras();
  for (const s of sugerencias.filter((x) => x.sugerido > 0)) {
    creadas.push(
      await upsertAlert({
        tipo: 'REPOSICION',
        titulo: 'Reposicion recomendada',
        mensaje: `${s.producto.nombre}: sugerido comprar ${s.sugerido} ${s.producto.unidad}. Stock actual: ${s.stock}.`,
        productoId: s.productoId,
      })
    );
  }

  return creadas;
}

// ------------------------------------------------------------
// Sugerencia de compras
// ------------------------------------------------------------

export async function sugerirCompras(dias = 30) {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const productos = await prisma.product.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' },
  });

  const resultado = [];

  for (const p of productos) {
    const stock = await stockProducto(p.id);
    const consumo = await prisma.inventoryMovement.aggregate({
      where: {
        productoId: p.id,
        tipo: 'SALIDA',
        createdAt: { gte: desde },
      },
      _sum: { cantidad: true },
    });
    const promedioDiario = (consumo._sum.cantidad || 0) / dias;
    const proyeccion = round(promedioDiario * dias);
    const meta = Math.max(p.stockMinimo, p.stockMinimo + proyeccion);
    const sugerido = round(Math.max(0, meta - stock));

    resultado.push({
      productoId: p.id,
      producto: p,
      stock,
      stockMinimo: p.stockMinimo,
      consumoPromedioDiario: round(promedioDiario),
      proyeccion,
      sugerido,
    });
  }

  return resultado;
}

// ------------------------------------------------------------
// Consumo teorico vs real (diferencias significativas)
// ------------------------------------------------------------

export async function detectarDiferenciasConsumo(desde, hasta, umbral) {
  const setting = await getSettings();
  const umbralReal = umbral ?? setting.umbralDiferencia ?? 0.1;

  const consumos = await prisma.consumption.groupBy({
    by: ['productoId'],
    _sum: { cantidadTeorica: true, cantidadReal: true },
    where: { createdAt: { gte: desde || new Date(0), lte: hasta || new Date() } },
  });

  const resultado = [];
  for (const c of consumos) {
    const teorico = c._sum.cantidadTeorica || 0;
    const real = c._sum.cantidadReal || 0;
    const diff = real - teorico;
    if (teorico > 0 && Math.abs(diff / teorico) >= umbralReal) {
      const producto = await prisma.product.findUnique({ where: { id: c.productoId } });
      resultado.push({ producto, teorico, real, diferencia: diff, porcentaje: diff / teorico });
    }
  }
  return resultado;
}
