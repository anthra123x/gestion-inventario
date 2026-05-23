'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateProductSchema, UpdateProductSchema, InventoryMovementSchema } from '@/lib/validations'
import { ProductCategory } from '@prisma/client'
import { getZodErrorMessage } from '@/lib/zod-error'
import { validateProductData, validateNonNegative, validatePriceMargin } from '@/lib/validations-data'
import { requireAdmin } from '@/modules/auth/auth.actions'

/**
 * Obtiene lista de productos con filtros opcionales
 * @param search - Texto para buscar en nombre o descripción
 * @param category - Categoría para filtrar productos
 * @returns Lista de productos activos (no eliminados)
 */
export async function getProducts(search?: string, category?: ProductCategory, page = 1, take = 20) {
  await requireAdmin()
  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(category && { category }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
    }),
    prisma.product.count({ where }),
  ])

  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / take),
  }
}

/**
 * Obtiene un producto por ID con sus movimientos de inventario
 * @param id - ID del producto
 * @returns Producto con movimientos de inventario ordenados por fecha
 */
export async function getProductById(id: string) {
  await requireAdmin()
  return await prisma.product.findUnique({
    where: { id, deletedAt: null },
    include: {
      inventoryMovements: {
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true }
          }
        }
      }
    }
  })
}

/**
 * Crea un nuevo producto con validaciones
 * @param formData - Datos del formulario de producto
 * @returns Resultado de la operación con producto creado o error
 */
export async function createProduct(formData: FormData) {
  await requireAdmin()
  const normalizedData = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    category: formData.get('category'),
    stock: Number(formData.get('stock')) || 0,
    minStock: Number(formData.get('minStock')) || 0,
    purchasePrice: Number(formData.get('purchasePrice')) || 0,
    salePrice: Number(formData.get('salePrice')) || 0,
    supplier: formData.get('supplier') || null,
  }

  const validatedFields = CreateProductSchema.safeParse(normalizedData)

  if (!validatedFields.success) {
    return {
      error: getZodErrorMessage(validatedFields),
    }
  }

  // Validate business logic
  try {
    validateProductData({
      stock: validatedFields.data.stock,
      purchasePrice: validatedFields.data.purchasePrice,
      salePrice: validatedFields.data.salePrice,
    })
  } catch (validationError: any) {
    return {
      error: validationError.message,
    }
  }

  try {
    const product = await prisma.product.create({
      data: validatedFields.data,
    })

    if (validatedFields.data.stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          type: 'ENTRY',
          quantity: validatedFields.data.stock,
          reason: 'Stock inicial',
        },
      })
    }

    revalidatePath('/inventory')
    return {
      success: 'Producto creado exitosamente',
      product,
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return {
        error: 'Ya existe un registro con estos datos únicos.',
      }
    }

    if (error instanceof Error) {
      return {
        error: error.message,
      }
    }

    return {
      error: 'Error desconocido al crear el producto',
    }
  }
}

/**
 * Actualiza un producto existente con validaciones
 * @param id - ID del producto a actualizar
 * @param formData - Datos del formulario de producto
 * @returns Resultado de la operación con producto actualizado o error
 */

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin()
  const normalizedData = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    category: formData.get('category'),
    stock: formData.get('stock') ? Number(formData.get('stock')) : undefined,
    minStock: formData.get('minStock') ? Number(formData.get('minStock')) : undefined,
    purchasePrice: formData.get('purchasePrice') ? Number(formData.get('purchasePrice')) : undefined,
    salePrice: formData.get('salePrice') ? Number(formData.get('salePrice')) : undefined,
    supplier: formData.get('supplier') || null,
  }

  const validatedFields = UpdateProductSchema.safeParse(normalizedData)

  if (!validatedFields.success) {
    return {
      error: getZodErrorMessage(validatedFields),
    }
  }

  // Validate business logic (only if values are provided)
  try {
    if (validatedFields.data.stock !== undefined) {
      validateNonNegative(validatedFields.data.stock, 'Stock')
    }
    if (validatedFields.data.purchasePrice !== undefined) {
      validateNonNegative(validatedFields.data.purchasePrice, 'Precio de compra')
    }
    if (validatedFields.data.salePrice !== undefined) {
      validateNonNegative(validatedFields.data.salePrice, 'Precio de venta')
    }
    if (validatedFields.data.purchasePrice !== undefined && validatedFields.data.salePrice !== undefined) {
      validatePriceMargin(validatedFields.data.purchasePrice, validatedFields.data.salePrice)
    }
  } catch (validationError: any) {
    return {
      error: validationError.message,
    }
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    revalidatePath(`/inventory/${id}`)
    return {
      success: 'Producto actualizado exitosamente',
      product,
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return {
        error: 'Ya existe un registro con estos datos únicos.',
      }
    }

    if (error.code === 'P2025') {
      return {
        error: 'Producto no encontrado',
      }
    }

    if (error instanceof Error) {
      return {
        error: error.message,
      }
    }

    return {
      error: 'Error desconocido al actualizar el producto',
    }
  }
}

/**
 * Elimina un producto (soft delete)
 * @param id - ID del producto a eliminar
 * @returns Resultado de la operación
 */
export async function deleteProduct(id: string) {
  await requireAdmin()
  try {
    const product = await prisma.product.findUnique({
      where: { id, deletedAt: null },
    })

    if (!product) {
      return {
        error: 'Producto no encontrado',
      }
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/inventory')
    return {
      success: 'Producto eliminado exitosamente',
    }
  } catch (error: any) {
    if (error.code === 'P2003') {
      return {
        error: 'No se puede eliminar el producto porque está relacionado con ventas o reparaciones. Usa la función de limpieza del sistema.',
      }
    }

    if (error.code === 'P2025') {
      return {
        error: 'Producto no encontrado',
      }
    }

    return {
      error: error instanceof Error ? error.message : 'Error al eliminar el producto',
    }
  }
}

export async function addInventoryMovement(formData: FormData) {
  await requireAdmin()
  const validatedFields = InventoryMovementSchema.safeParse({
    productId: formData.get('productId'),
    type: formData.get('type'),
    quantity: parseInt(formData.get('quantity') as string),
    reason: formData.get('reason'),
  })

  if (!validatedFields.success) {
    return {
      error: getZodErrorMessage(validatedFields),
    }
  }

  try {
    const product = await prisma.product.findUnique({
      where: { id: validatedFields.data.productId, deletedAt: null },
      select: { stock: true },
    })

    if (!product) {
      return { error: 'Producto no encontrado' }
    }

    if (validatedFields.data.type === 'EXIT' && product.stock < validatedFields.data.quantity) {
      return { error: `Stock insuficiente. Disponible: ${product.stock}, solicitado: ${validatedFields.data.quantity}` }
    }

    const [movement, updatedProduct] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: validatedFields.data,
      }),
      prisma.product.update({
        where: { id: validatedFields.data.productId },
        data: {
          stock: {
            increment: validatedFields.data.type === 'ENTRY' ? validatedFields.data.quantity : -validatedFields.data.quantity,
          },
        },
      }),
    ])

    revalidatePath('/inventory')
    revalidatePath(`/inventory/${validatedFields.data.productId}`)

    return {
      success: `Movimiento de inventario registrado. Stock actual: ${updatedProduct.stock}`,
      movement,
    }
  } catch (error: any) {
    return {
      error: error.message || 'Error al registrar movimiento de inventario',
    }
  }
}

export async function getInventorySummary() {
  await requireAdmin()
  const [totalProducts, totalStockAgg, lowStockCount, categories] = await Promise.all([
    prisma.product.count({
      where: { deletedAt: null },
    }),
    prisma.product.aggregate({
      where: { deletedAt: null },
      _sum: { stock: true },
    }),
    prisma.product.findMany({
      where: {
        deletedAt: null,
        stock: { gt: 0 },
      },
      select: {
        id: true,
        stock: true,
        minStock: true,
      },
    }),
    prisma.product.groupBy({
      by: ['category'],
      where: { deletedAt: null },
      _count: { id: true },
    }),
  ])

  const lowStockProducts = lowStockCount.filter(p => p.stock <= p.minStock).length

  return {
    totalProducts,
    totalStock: totalStockAgg._sum.stock || 0,
    lowStockProducts,
    categories,
  }
}

export async function getInventoryStockBreakdown() {
  await requireAdmin()
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { stock: true, minStock: true },
  })

  const inStock = products.filter(p => p.stock > p.minStock).length
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length
  const outOfStock = products.filter(p => p.stock === 0).length

  return {
    total: products.length,
    inStock,
    lowStock,
    outOfStock,
  }
}

export async function getLowStockProducts() {
  await requireAdmin()
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, stock: true, minStock: true, category: true, salePrice: true },
    orderBy: { stock: 'asc' },
    take: 50,
  })
  return products.filter(p => p.stock <= p.minStock).slice(0, 10)
}