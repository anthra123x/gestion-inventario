'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateProductSchema, UpdateProductSchema, InventoryMovementSchema } from '@/lib/validations'
import { ProductCategory } from '@prisma/client'

export async function getProducts(search?: string, category?: ProductCategory) {
  const where = {
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
    include: {
      inventoryMovements: {
        take: 5,
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

export async function createProduct(formData: FormData) {
  const validatedFields = CreateProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    stock: parseInt(formData.get('stock') as string),
    minStock: parseInt(formData.get('minStock') as string),
    purchasePrice: parseFloat(formData.get('purchasePrice') as string),
    salePrice: parseFloat(formData.get('salePrice') as string),
    supplier: formData.get('supplier'),
    barcode: formData.get('barcode'),
  })

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map((e: any) => e.message).join(', ')
    return {
      error: errorMessages || 'Datos inválidos',
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
  } catch (error) {
    return {
      error: 'Error al crear el producto',
    }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  const validatedFields = UpdateProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    stock: formData.get('stock') ? parseInt(formData.get('stock') as string) : undefined,
    minStock: formData.get('minStock') ? parseInt(formData.get('minStock') as string) : undefined,
    purchasePrice: formData.get('purchasePrice') ? parseFloat(formData.get('purchasePrice') as string) : undefined,
    salePrice: formData.get('salePrice') ? parseFloat(formData.get('salePrice') as string) : undefined,
    supplier: formData.get('supplier'),
    barcode: formData.get('barcode'),
  })

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map((e: any) => e.message).join(', ')
    return {
      error: errorMessages || 'Datos inválidos',
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
  } catch (error) {
    return {
      error: 'Error al actualizar el producto',
    }
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    })

    revalidatePath('/inventory')
    return {
      success: 'Producto eliminado exitosamente',
    }
  } catch (error) {
    return {
      error: 'Error al eliminar el producto',
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
