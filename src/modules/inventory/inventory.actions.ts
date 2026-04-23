'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateProductSchema, UpdateProductSchema, InventoryMovementSchema } from '@/lib/validations'
import { ProductCategory } from '@prisma/client'
import { validateProductData, validateNonNegative, validatePriceMargin } from '@/lib/validations-data'

/**
 * Obtiene lista de productos con filtros opcionales
 * @param search - Texto para buscar en nombre, descripción o barcode
 * @param category - Categoría para filtrar productos
 * @returns Lista de productos activos (no eliminados)
 */
export async function getProducts(search?: string, category?: ProductCategory) {
  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { barcode: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(category && { category }),
  }

  return await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Obtiene un producto por ID con sus movimientos de inventario
 * @param id - ID del producto
 * @returns Producto con movimientos de inventario ordenados por fecha
 */
export async function getProductById(id: string) {
  return await prisma.product.findUnique({
    where: { id },
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
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    stock: formData.get('stock'),
    minStock: formData.get('minStock'),
    purchasePrice: formData.get('purchasePrice'),
    salePrice: formData.get('salePrice'),
    supplier: formData.get('supplier'),
    barcode: formData.get('barcode'),
  }

  // Normalizar datos antes de validar
const barcodeValue = formData.get('barcode')
    const normalizedData = {
      name: formData.get('name'),
      description: formData.get('description') || null,
      category: formData.get('category'),
      stock: Number(formData.get('stock')) || 0,
      minStock: Number(formData.get('minStock')) || 0,
      purchasePrice: Number(formData.get('purchasePrice')) || 0,
      salePrice: Number(formData.get('salePrice')) || 0,
      supplier: formData.get('supplier') || null,
      barcode: barcodeValue && String(barcodeValue).trim() ? String(barcodeValue).trim() : null,
    }

  const validatedFields = CreateProductSchema.safeParse(normalizedData)

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map((e: any) => e.message).join(', ')
    return {
      error: errorMessages || 'Datos inválidos',
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

    // Create initial inventory movement if stock > 0
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
    // Manejar error de unique constraint específicamente
    if (error.code === 'P2002') {
      // P2002: Unique constraint failed
      const target = error.meta?.target
      if (target && target.includes('barcode')) {
        return {
          error: 'El código de barras ya está registrado en otro producto. Usa un código diferente o déjalo vacío.',
        }
      }
      return {
        error: 'Ya existe un registro con estos datos únicos.',
      }
    }

    // Devolver error específico
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
  const rawData = {
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    stock: formData.get('stock'),
    minStock: formData.get('minStock'),
    purchasePrice: formData.get('purchasePrice'),
    salePrice: formData.get('salePrice'),
    supplier: formData.get('supplier'),
    barcode: formData.get('barcode'),
  }

  // Normalizar datos antes de validar
  const normalizedData = {
    name: formData.get('name'),
    description: formData.get('description') || null,
    category: formData.get('category'),
    stock: formData.get('stock') ? Number(formData.get('stock')) : undefined,
    minStock: formData.get('minStock') ? Number(formData.get('minStock')) : undefined,
    purchasePrice: formData.get('purchasePrice') ? Number(formData.get('purchasePrice')) : undefined,
    salePrice: formData.get('salePrice') ? Number(formData.get('salePrice')) : undefined,
    supplier: formData.get('supplier') || null,
    barcode: (() => {
      const val = formData.get('barcode')
      return val && String(val).trim() ? String(val).trim() : null
    })(),
  }

  const validatedFields = UpdateProductSchema.safeParse(normalizedData)

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map((e: any) => e.message).join(', ')
    return {
      error: errorMessages || 'Datos inválidos',
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
    // Validate price margin if both prices are provided
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
    // Manejar error de unique constraint específicamente
    if (error.code === 'P2002') {
      // P2002: Unique constraint failed
      const target = error.meta?.target
      if (target && target.includes('barcode')) {
        return {
          error: 'El código de barras ya está registrado en otro producto. Usa un código diferente o déjalo vacío.',
        }
      }
      return {
        error: 'Ya existe un registro con estos datos únicos.',
      }
    }

    // Devolver error específico
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
 * Elimina un producto usando soft delete (marca como eliminado)
 * @param id - ID del producto a eliminar
 * @returns Resultado de la operación
 */
export async function deleteProduct(id: string) {
  try {
    // Verificar si el producto tiene relaciones antes de eliminar
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        saleItems: true,
        repairParts: true,
        inventoryMovements: true,
      },
    })

    if (!product) {
      return {
        error: 'Producto no encontrado',
      }
    }

    // Soft delete - marcar como eliminado en lugar de borrar permanentemente
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/inventory')
    return {
      success: 'Producto eliminado exitosamente',
    }
  } catch (error: any) {
    // Manejar error de foreign key
    if (error.code === 'P2003') {
      return {
        error: 'No se puede eliminar el producto porque está relacionado con ventas o reparaciones. Usa la función de limpieza del sistema.',
      }
    }

    // Manejar error de registro no encontrado
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
  const validatedFields = InventoryMovementSchema.safeParse({
    productId: formData.get('productId'),
    type: formData.get('type'),
    quantity: parseInt(formData.get('quantity') as string),
    reason: formData.get('reason'),
  })

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map((e: any) => e.message).join(', ')
    return {
      error: errorMessages || 'Datos inválidos',
    }
  }

  try {
    const { productId, type, quantity, reason } = validatedFields.data

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return {
        error: 'Producto no encontrado',
      }
    }

    // Check if there's enough stock for exit movements
    if (type === 'EXIT' && product.stock < quantity) {
      return {
        error: 'Stock insuficiente',
      }
    }

    // Create movement
    await prisma.inventoryMovement.create({
      data: {
        productId,
        type,
        quantity,
        reason,
      },
    })

    // Update product stock
    const newStock = type === 'ENTRY' 
      ? product.stock + quantity 
      : product.stock - quantity

    await prisma.product.update({
      where: { id: productId },
      data: { stock: newStock },
    })

    revalidatePath('/inventory')
    revalidatePath(`/inventory/${productId}`)
    return {
      success: 'Movimiento de inventario registrado exitosamente',
    }
  } catch (error) {
    return {
      error: 'Error al registrar movimiento',
    }
  }
}

export async function getLowStockProducts() {
  return await prisma.product.findMany({
    where: {
      stock: {
        lte: prisma.product.fields.minStock,
      },
    },
    orderBy: {
      stock: 'asc',
    },
  })
}

export async function getProductsByCategory() {
  const products = await prisma.product.groupBy({
    by: ['category'],
    _count: {
      id: true,
    },
    _sum: {
      stock: true,
    },
  })

  return products.map(item => ({
    category: item.category,
    count: item._count.id,
    totalStock: item._sum.stock || 0,
  }))
}
