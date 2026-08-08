import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { auth, requirePermiso } from '../middleware/auth.js';
import { ok, fail } from '../lib/http.js';
import { stockProducto } from '../services/fefoPeps.js';

const router = Router();
router.use(auth);

// ============================================================
// CATEGORIAS
// ============================================================

router.get('/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { orden: 'asc' },
    include: { _count: { select: { products: true } } },
  });
  return ok(res, categories);
});

router.post('/categories', requirePermiso('catalogo.gestionar'), async (req, res) => {
  const { nombre, descripcion, orden } = req.body;
  if (!nombre) return fail(res, 'Nombre requerido');
  try {
    const category = await prisma.category.create({ data: { nombre, descripcion, orden: orden || 0 } });
    return ok(res, category, 201);
  } catch {
    return fail(res, 'Ya existe una categoria con ese nombre', 409);
  }
});

router.put('/categories/:id', requirePermiso('catalogo.gestionar'), async (req, res) => {
  const { nombre, descripcion, orden } = req.body;
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { nombre, descripcion, orden },
    });
    return ok(res, category);
  } catch {
    return fail(res, 'Categoria no encontrada', 404);
  }
});

router.delete('/categories/:id', requirePermiso('catalogo.gestionar'), async (req, res) => {
  const count = await prisma.product.count({ where: { categoriaId: req.params.id } });
  if (count > 0) return fail(res, 'No se puede eliminar: tiene productos asociados', 409);
  await prisma.category.delete({ where: { id: req.params.id } });
  return ok(res, { ok: true });
});

// ============================================================
// PRODUCTOS
// ============================================================

const productInclude = {
  categoria: true,
  recipeFor: { include: { items: { include: { ingrediente: true } } } },
  _count: { select: { lots: true } },
};

router.get('/products', async (req, res) => {
  const { vendibles } = req.query;
  const products = await prisma.product.findMany({
    where: vendibles ? { esVendible: true, activo: true } : undefined,
    include: productInclude,
    orderBy: { nombre: 'asc' },
  });
  const conStock = await Promise.all(
    products.map(async (p) => ({ ...p, stock: await stockProducto(p.id) }))
  );
  return ok(res, conStock);
});

router.get('/products/:id', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: productInclude,
  });
  if (!product) return fail(res, 'Producto no encontrado', 404);
  return ok(res, { ...product, stock: await stockProducto(product.id) });
});

router.post('/products', requirePermiso('catalogo.gestionar'), async (req, res) => {
  const {
    codigo, nombre, categoriaId, unidad, stockMinimo, stockMaximo,
    costo, precioVenta, esVendible, esPerecedero, imagen,
  } = req.body;
  if (!codigo || !nombre || !categoriaId) return fail(res, 'Codigo, nombre y categoria requeridos');
  try {
    const product = await prisma.product.create({
      data: {
        codigo, nombre, categoriaId, unidad: unidad || 'und',
        stockMinimo: stockMinimo || 0, stockMaximo,
        costo: costo || 0, precioVenta: precioVenta || 0,
        esVendible: !!esVendible, esPerecedero: esPerecedero !== false, imagen,
      },
    });
    return ok(res, product, 201);
  } catch {
    return fail(res, 'El codigo de producto ya existe', 409);
  }
});

router.put('/products/:id', requirePermiso('catalogo.gestionar'), async (req, res) => {
  const {
    codigo, nombre, categoriaId, unidad, stockMinimo, stockMaximo,
    costo, precioVenta, esVendible, esPerecedero, imagen, activo,
  } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { codigo, nombre, categoriaId, unidad, stockMinimo, stockMaximo, costo, precioVenta, esVendible, esPerecedero, imagen, activo },
    });
    return ok(res, product);
  } catch {
    return fail(res, 'Producto no encontrado o codigo duplicado', 409);
  }
});

router.delete('/products/:id', requirePermiso('catalogo.gestionar'), async (req, res) => {
  const deps = await prisma.orderItem.count({ where: { productoId: req.params.id } });
  if (deps > 0) return fail(res, 'No se puede eliminar: tiene historial de pedidos', 409);
  await prisma.product.delete({ where: { id: req.params.id } });
  return ok(res, { ok: true });
});

// ============================================================
// RECETAS
// ============================================================

router.get('/recipes', async (req, res) => {
  const recipes = await prisma.recipe.findMany({
    include: {
      producto: { include: { categoria: true } },
      items: { include: { ingrediente: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return ok(res, recipes);
});

// POST /api/catalog/recipes  { productoId, descripcion, rendimiento, items: [{ingredienteId, cantidad}] }
router.post('/recipes', requirePermiso('recetas.gestionar'), async (req, res) => {
  const { productoId, descripcion, rendimiento, items } = req.body;
  if (!productoId || !Array.isArray(items) || items.length === 0) {
    return fail(res, 'Producto e ingredientes requeridos');
  }
  const producto = await prisma.product.findUnique({ where: { id: productoId } });
  if (!producto) return fail(res, 'Producto no encontrado', 404);

  const data = items.map((i) => ({
    ingredienteId: i.ingredienteId,
    cantidad: Number(i.cantidad),
  }));

  const recipe = await prisma.recipe.upsert({
    where: { productoId },
    update: { descripcion, rendimiento: rendimiento || 1, items: { deleteMany: {}, create: data } },
    create: {
      productoId,
      descripcion,
      rendimiento: rendimiento || 1,
      items: { create: data },
    },
    include: { producto: true, items: { include: { ingrediente: true } } },
  });
  await prisma.product.update({ where: { id: productoId }, data: { esVendible: true } });
  return ok(res, recipe, 201);
});

router.delete('/recipes/:id', requirePermiso('recetas.gestionar'), async (req, res) => {
  await prisma.recipe.delete({ where: { id: req.params.id } });
  return ok(res, { ok: true });
});

export default router;
