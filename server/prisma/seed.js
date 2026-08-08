import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PERMISOS_DEFAULT } from '../src/lib/permisos.js';
import { registrarEntrada, procesarConsumoItem } from '../src/services/fefoPeps.js';
import { detectarAlertas } from '../src/services/alertas.js';

const prisma = new PrismaClient();

const PASSWORD = '123456';
const now = new Date();
const days = (n) => {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
};

async function main() {
  console.log('== MixGustos: generando seed ==');

  // ---------------- Configuracion ----------------
  await prisma.setting.create({
    data: {
      nombreRestaurante: 'MixGustos',
      moneda: 'S/',
      igv: 0.18,
      metodoInventario: 'FEFO',
      diasProximosVencer: 7,
      umbralDiferencia: 0.1,
      ruc: '20601234567',
      direccion: 'Av. Los Sabores 123, Centro',
      telefono: '(01) 555-1234',
      horarioAtencion: 'Lun-Dom 12:00 - 22:00',
      politicaFEFO: 'FEFO prioritario en perecederos; PEPS como criterio complementario.',
    },
  });

  // ---------------- Categorias ----------------
  const cat = {};
  for (const c of [
    { nombre: 'Carnes', orden: 1 },
    { nombre: 'Mariscos y Pescados', orden: 2 },
    { nombre: 'Guarniciones y Entradas', orden: 3 },
    { nombre: 'Bebidas', orden: 4 },
    { nombre: 'Insumos', orden: 5 },
  ]) {
    cat[c.nombre] = await prisma.category.create({ data: c });
  }

  // ---------------- Productos ----------------
  async function crearProducto(data) {
    return prisma.product.create({ data });
  }

  // Vendibles (platos)
  const lomo = await crearProducto({ codigo: 'PL-001', nombre: 'Lomo Saltado', categoriaId: cat['Carnes'].id, unidad: 'plato', precioVenta: 28, esVendible: true, esPerecedero: true });
  const ceviche = await crearProducto({ codigo: 'PL-002', nombre: 'Ceviche Clásico', categoriaId: cat['Mariscos y Pescados'].id, unidad: 'plato', precioVenta: 32, esVendible: true, esPerecedero: true });
  const chaufa = await crearProducto({ codigo: 'PL-003', nombre: 'Arroz Chaufa', categoriaId: cat['Carnes'].id, unidad: 'plato', precioVenta: 24, esVendible: true, esPerecedero: true });
  const huancaina = await crearProducto({ codigo: 'PL-004', nombre: 'Papa a la Huancaína', categoriaId: cat['Guarniciones y Entradas'].id, unidad: 'porción', precioVenta: 15, esVendible: true, esPerecedero: true });
  const chicha = await crearProducto({ codigo: 'PL-005', nombre: 'Chicha Morada', categoriaId: cat['Bebidas'].id, unidad: 'vaso', precioVenta: 6, esVendible: true, esPerecedero: false });
  const incaKola = await crearProducto({ codigo: 'PL-006', nombre: 'Inca Kola 500ml', categoriaId: cat['Bebidas'].id, unidad: 'und', precioVenta: 5, esVendible: true, esPerecedero: false });

  // Insumos (materia prima)
  const carne = await crearProducto({ codigo: 'IN-001', nombre: 'Carne de res', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 5000, costo: 0.028, esVendible: false, esPerecedero: true });
  const papa = await crearProducto({ codigo: 'IN-002', nombre: 'Papa amarilla', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 8000, costo: 0.004, esVendible: false, esPerecedero: true });
  const tomate = await crearProducto({ codigo: 'IN-003', nombre: 'Tomate', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 3000, costo: 0.005, esVendible: false, esPerecedero: true });
  const cebolla = await crearProducto({ codigo: 'IN-004', nombre: 'Cebolla roja', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 3000, costo: 0.004, esVendible: false, esPerecedero: true });
  const aceite = await crearProducto({ codigo: 'IN-005', nombre: 'Aceite vegetal', categoriaId: cat['Insumos'].id, unidad: 'ml', stockMinimo: 3000, costo: 0.01, esVendible: false, esPerecedero: false });
  const corvina = await crearProducto({ codigo: 'IN-006', nombre: 'Corvina', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 5000, costo: 0.045, esVendible: false, esPerecedero: true });
  const limon = await crearProducto({ codigo: 'IN-007', nombre: 'Limón', categoriaId: cat['Insumos'].id, unidad: 'ml', stockMinimo: 3000, costo: 0.008, esVendible: false, esPerecedero: true });
  const ajilimo = await crearProducto({ codigo: 'IN-008', nombre: 'Ají limo', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 500, costo: 0.03, esVendible: false, esPerecedero: true });
  const culantro = await crearProducto({ codigo: 'IN-009', nombre: 'Culantro', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 300, costo: 0.02, esVendible: false, esPerecedero: true });
  const arroz = await crearProducto({ codigo: 'IN-010', nombre: 'Arroz', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 10000, costo: 0.004, esVendible: false, esPerecedero: false });
  const huancainaSalsa = await crearProducto({ codigo: 'IN-011', nombre: 'Salsa huancaína', categoriaId: cat['Insumos'].id, unidad: 'ml', stockMinimo: 2000, costo: 0.012, esVendible: false, esPerecedero: true });
  const maizMorado = await crearProducto({ codigo: 'IN-012', nombre: 'Maíz morado', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 1000, costo: 0.006, esVendible: false, esPerecedero: false });
  const azucar = await crearProducto({ codigo: 'IN-013', nombre: 'Azúcar', categoriaId: cat['Insumos'].id, unidad: 'g', stockMinimo: 2000, costo: 0.003, esVendible: false, esPerecedero: false });

  // ---------------- Recetas ----------------
  async function crearReceta(producto, descripcion, items) {
    return prisma.recipe.create({
      data: {
        productoId: producto.id,
        descripcion,
        items: {
          create: items.map(([ingrediente, cantidad]) => ({
            ingredienteId: ingrediente.id,
            cantidad,
          })),
        },
      },
    });
  }

  await crearReceta(lomo, 'Lomo saltado con papa, tomate y cebolla', [
    [carne, 250], [papa, 150], [tomate, 100], [cebolla, 50], [aceite, 30],
  ]);
  await crearReceta(ceviche, 'Ceviche de corvina con limón y ají limo', [
    [corvina, 180], [limon, 60], [cebolla, 40], [ajilimo, 10], [culantro, 5],
  ]);
  await crearReceta(chaufa, 'Arroz chaufa de carne', [
    [arroz, 200], [carne, 80], [cebolla, 20], [aceite, 20],
  ]);
  await crearReceta(huancaina, 'Papa amarilla con salsa huancaína', [
    [papa, 200], [huancainaSalsa, 80],
  ]);
  await crearReceta(chicha, 'Chicha morada casera', [
    [maizMorado, 30], [azucar, 25],
  ]);

  // ---------------- Mesas ----------------
  for (let i = 1; i <= 10; i++) {
    await prisma.table.create({
      data: { numero: i, nombre: `Mesa ${i}`, capacidad: i % 3 === 0 ? 6 : 4 },
    });
  }

  // ---------------- Proveedores ----------------
  const provMercado = await prisma.supplier.create({ data: { nombre: 'Mercado Central', ruc: '20123456789', telefono: '(01) 555-0001', direccion: 'Av. Principal s/n' } });
  const provElSol = await prisma.supplier.create({ data: { nombre: 'Distribuidora El Sol', ruc: '20198765432', telefono: '(01) 555-0002', direccion: 'Jr. Comercio 456' } });
  const provAndinas = await prisma.supplier.create({ data: { nombre: 'Inversiones Andinas', ruc: '20555555555', telefono: '(01) 555-0003', direccion: 'Av. Industrial 789' } });

  // ---------------- Usuarios ----------------
  const hash = await bcrypt.hash(PASSWORD, 10);
  const usuarios = {
    admin: await prisma.user.create({ data: { username: 'admin', email: 'admin@mixgustos.com', password: hash, rol: 'ADMINISTRADOR', nombre: 'Administrador' } }),
    gerente: await prisma.user.create({ data: { username: 'gerente', email: 'gerente@mixgustos.com', password: hash, rol: 'GERENTE', nombre: 'Gerente General', telefono: '999111222' } }),
    mzsalon: await prisma.user.create({ data: { username: 'mzsalon', email: 'mozosal@mixgustos.com', password: hash, rol: 'MOZO_SALON', nombre: 'Carlos Salón', telefono: '999333444' } }),
    mzpuerta: await prisma.user.create({ data: { username: 'mzpuerta', email: 'mozopue@mixgustos.com', password: hash, rol: 'MOZO_PUERTA', nombre: 'María Puerta', telefono: '999555666' } }),
    cocina: await prisma.user.create({ data: { username: 'cocina', email: 'cocinero@mixgustos.com', password: hash, rol: 'COCINERO', nombre: 'Chef Andrés' } }),
    almacen: await prisma.user.create({ data: { username: 'almacen', email: 'almacenero@mixgustos.com', password: hash, rol: 'ALMACENERO', nombre: 'Luis Almacén' } }),
    cliente: await prisma.user.create({ data: { username: 'cliente', email: 'cliente@mixgustos.com', password: hash, rol: 'CLIENTE', nombre: 'Cliente Demo' } }),
  };

  // Permisos por rol
  for (const [rol, permisos] of Object.entries(PERMISOS_DEFAULT)) {
    await prisma.rolePermission.create({ data: { rol, permisos } });
  }

  // ---------------- Lotes (stock inicial) ----------------
  // Carne: 2 lotes para demostrar FEFO/PEPS (uno vence antes)
  await registrarEntrada({ productoId: carne.id, cantidad: 12000, fechaIngreso: days(-10), fechaVencimiento: days(22), costoUnitario: 0.028, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: carne.id, cantidad: 15000, fechaIngreso: days(-6), fechaVencimiento: days(7), costoUnitario: 0.03, userId: usuarios.almacen.id, motivo: 'Seed' });

  await registrarEntrada({ productoId: papa.id, cantidad: 20000, fechaIngreso: days(-5), fechaVencimiento: days(15), costoUnitario: 0.004, userId: usuarios.almacen.id, motivo: 'Seed' });
  // Tomate vencido (para alerta VENCIDO)
  await registrarEntrada({ productoId: tomate.id, cantidad: 4000, fechaIngreso: days(-20), fechaVencimiento: days(-1), costoUnitario: 0.005, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: tomate.id, cantidad: 3000, fechaIngreso: days(-3), fechaVencimiento: days(6), costoUnitario: 0.005, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: cebolla.id, cantidad: 6000, fechaIngreso: days(-4), fechaVencimiento: days(10), costoUnitario: 0.004, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: aceite.id, cantidad: 5000, fechaIngreso: days(-8), fechaVencimiento: days(120), costoUnitario: 0.01, userId: usuarios.almacen.id, motivo: 'Seed' });
  // Corvina: proxima a vencer (alerta PROXIMO_VENCER)
  await registrarEntrada({ productoId: corvina.id, cantidad: 10000, fechaIngreso: days(-4), fechaVencimiento: days(3), costoUnitario: 0.045, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: limon.id, cantidad: 6000, fechaIngreso: days(-2), fechaVencimiento: days(8), costoUnitario: 0.008, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: ajilimo.id, cantidad: 800, fechaIngreso: days(-3), fechaVencimiento: days(5), costoUnitario: 0.03, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: culantro.id, cantidad: 400, fechaIngreso: days(-1), fechaVencimiento: days(4), costoUnitario: 0.02, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: arroz.id, cantidad: 15000, fechaIngreso: days(-7), fechaVencimiento: days(90), costoUnitario: 0.004, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: huancainaSalsa.id, cantidad: 4000, fechaIngreso: days(-3), fechaVencimiento: days(9), costoUnitario: 0.012, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: maizMorado.id, cantidad: 3000, fechaIngreso: days(-9), fechaVencimiento: days(60), costoUnitario: 0.006, userId: usuarios.almacen.id, motivo: 'Seed' });
  await registrarEntrada({ productoId: azucar.id, cantidad: 5000, fechaIngreso: days(-9), fechaVencimiento: days(120), costoUnitario: 0.003, userId: usuarios.almacen.id, motivo: 'Seed' });
  // Inca Kola: unidades
  await registrarEntrada({ productoId: incaKola.id, cantidad: 50, fechaIngreso: days(-5), fechaVencimiento: days(200), costoUnitario: 3.2, userId: usuarios.almacen.id, motivo: 'Seed' });

  // ---------------- Ordenes de compra ----------------
  const po1 = await prisma.purchaseOrder.create({
    data: {
      numero: 'OC-20260101-001',
      proveedorId: provElSol.id,
      estado: 'RECIBIDA',
      fechaPedido: days(-9),
      fechaRecepcion: days(-7),
      costoTotal: 750,
      userId: usuarios.almacen.id,
      items: {
        create: [
          { productoId: carne.id, cantidadSolicitada: 20000, cantidadRecibida: 20000, costoUnitario: 0.028 },
          { productoId: papa.id, cantidadSolicitada: 30000, cantidadRecibida: 30000, costoUnitario: 0.004 },
        ],
      },
    },
  });
  await registrarEntrada({ productoId: carne.id, cantidad: 20000, fechaIngreso: days(-7), fechaVencimiento: days(23), costoUnitario: 0.028, userId: usuarios.almacen.id, motivo: `Recepcion ${po1.numero}` });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      numero: 'OC-20260105-001',
      proveedorId: provMercado.id,
      estado: 'ENVIADA',
      fechaPedido: days(-1),
      fechaEsperada: days(2),
      costoTotal: 900,
      userId: usuarios.almacen.id,
      items: {
        create: [
          { productoId: corvina.id, cantidadSolicitada: 15000, costoUnitario: 0.045 },
          { productoId: limon.id, cantidadSolicitada: 10000, costoUnitario: 0.008 },
        ],
      },
    },
  });

  // ---------------- Pedidos demo ----------------
  const mesa2 = await prisma.table.findUnique({ where: { numero: 2 } });
  const mesa5 = await prisma.table.findUnique({ where: { numero: 5 } });

  async function crearPedido({ codigo, tipo, estado, mesaId, creador, clienteNombre, observaciones, items, createdAt }) {
    const detalle = items.map(([p, cantidad, obs]) => ({
      productoId: p.id,
      cantidad,
      precio: p.precioVenta,
      observaciones: obs,
    }));
    const total = detalle.reduce((a, d) => a + d.precio * d.cantidad, 0);
    return prisma.order.create({
      data: {
        codigo,
        tipo,
        estado,
        mesaId,
        clienteNombre,
        observaciones,
        createdById: creador.id,
        total,
        createdAt,
        items: { create: detalle },
        history: {
          create: [
            { estado: 'CREADO', userId: creador.id, comentario: 'Pedido creado', createdAt },
            ...(estado !== 'CREADO' ? [{ estado: 'CONFIRMADO', userId: creador.id, comentario: 'Confirmado', createdAt }] : []),
            ...(['RECIBIDO_COCINA', 'EN_PREPARACION', 'LISTO', 'ENTREGADO', 'FINALIZADO'].includes(estado)
              ? [{ estado: 'RECIBIDO_COCINA', userId: usuarios.cocina.id, comentario: 'Recibido por cocina', createdAt: days(0) }]
              : []),
            ...(['EN_PREPARACION', 'LISTO', 'ENTREGADO', 'FINALIZADO'].includes(estado)
              ? [{ estado: 'EN_PREPARACION', userId: usuarios.cocina.id, comentario: 'En preparacion', createdAt: days(0) }]
              : []),
            ...(['LISTO', 'ENTREGADO', 'FINALIZADO'].includes(estado)
              ? [{ estado: 'LISTO', userId: usuarios.cocina.id, comentario: 'Listo', createdAt: days(0) }]
              : []),
            ...(['ENTREGADO', 'FINALIZADO'].includes(estado)
              ? [{ estado: 'ENTREGADO', userId: creador.id, comentario: 'Entregado', createdAt: days(0) }]
              : []),
            ...(estado === 'FINALIZADO'
              ? [{ estado: 'FINALIZADO', userId: creador.id, comentario: 'Finalizado', createdAt: days(0) }]
              : []),
            ...(estado === 'CANCELADO'
              ? [{ estado: 'CANCELADO', userId: creador.id, comentario: 'Cancelado por el cliente', createdAt }]
              : []),
          ],
        },
      },
      include: { items: true },
    });
  }

  // Pedido activo en mesa 2 (EN_PREPARACION)
  const pedidoActivo = await crearPedido({
    codigo: 'M20260108-001', tipo: 'MESA', estado: 'EN_PREPARACION', mesaId: mesa2.id,
    creador: usuarios.mzsalon, clienteNombre: 'Familia Quispe', observaciones: 'Sin ají',
    items: [[lomo, 2], [ceviche, 1], [chicha, 3]],
    createdAt: days(0),
  });

  // Pedido para llevar LISTO (mozo de puerta)
  await crearPedido({
    codigo: 'L20260108-001', tipo: 'PARA_LLEVAR', estado: 'LISTO', mesaId: null,
    creador: usuarios.mzpuerta, clienteNombre: 'Juan Pérez', observaciones: 'Para recoger en 20 min',
    items: [[chaufa, 2], [chicha, 2], [incaKola, 2]],
    createdAt: days(0),
  });

  // Pedido FINALIZADO hace 2 dias (genera consumo FEFO/PEPS y alimenta reportes)
  const pedidoVendido = await crearPedido({
    codigo: 'M20260106-001', tipo: 'MESA', estado: 'FINALIZADO', mesaId: mesa5.id,
    creador: usuarios.mzsalon, clienteNombre: 'Grupo 8 personas', observaciones: 'Cumpleaños',
    items: [[lomo, 3], [ceviche, 2], [huancaina, 2], [chicha, 4], [incaKola, 4]],
    createdAt: days(-2),
  });

  // Pedido CANCELADO
  await crearPedido({
    codigo: 'R20260107-001', tipo: 'PARA_RECOGER', estado: 'CANCELADO', mesaId: null,
    creador: usuarios.mzpuerta, clienteNombre: 'Pedro Torres',
    items: [[lomo, 1], [chicha, 1]],
    createdAt: days(-1),
  });

  // Procesar consumo del pedido FINALIZADO (recetas -> ingredientes -> FEFO/PEPS)
  for (const item of pedidoVendido.items) {
    await procesarConsumoItem(item.id);
  }

  // ---------------- Alertas ----------------
  await detectarAlertas();

  console.log('== Seed completado ==');
  console.log('Usuarios demo (password: 123456):');
  console.log('  admin / gerente / mzsalon / mzpuerta / cocina / almacen / cliente');
  console.log('Pedido activo:', pedidoActivo.codigo, '| Pedido vendido:', pedidoVendido.codigo);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
