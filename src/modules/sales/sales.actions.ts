'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateSaleSchema } from '@/lib/validations'
import { validateSaleItemData, validateNonNegative } from '@/lib/validations-data'
import { PaymentMethod } from '@prisma/client'

export async function getSales(search?: string, startDate?: Date, endDate?: Date) {
  const where = {
    ...(search && {
      OR: [
        { client: { name: { contains: search, mode: 'insensitive' as const } } },
        { client: { phone: { contains: search, mode: 'insensitive' as const } } },
        { notes: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(startDate && endDate && {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }),
  }

  return await prisma.sale.findMany({
    where,
    include: {
      client: true,
      saleItems: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getSaleById(id: string) {
  return await prisma.sale.findUnique({
    where: { id },
    include: {
      client: true,
      saleItems: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  })
}

export async function createSale(formData: FormData) {
  const itemsJson = formData.get('items') as string
  const items = JSON.parse(itemsJson)

  const validatedFields = CreateSaleSchema.safeParse({
    clientId: formData.get('clientId') || null,
    items,
    paymentMethod: formData.get('paymentMethod') as PaymentMethod,
    notes: formData.get('notes') || null,
  })

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.issues.map((e: any) => e.message).join(', ')
    return {
      error: errorMessages || 'Datos inválidos',
    }
  }

  // Validate business logic
  try {
    for (const item of validatedFields.data.items) {
      validateSaleItemData({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
      })
    }
  } catch (validationError: any) {
    return {
      error: validationError.message,
    }
  }

  try {
    const { clientId, items, paymentMethod, notes } = validatedFields.data

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    // Use transaction for atomicity
    const sale = await prisma.$transaction(async (tx) => {
      // Check stock availability with lock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (!product) {
          throw new Error(`Producto con ID ${item.productId} no encontrado`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`)
        }
      }

      // Create sale
      const newSale = await tx.sale.create({
        data: {
          clientId,
          total,
          paymentMethod,
          notes,
          saleItems: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
            })),
          },
        },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      })

      // Update stock and create inventory movements
      for (const item of items) {
        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })

        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'EXIT',
            quantity: item.quantity,
            reason: `Venta #${newSale.id}`,
            referenceId: newSale.id,
            referenceType: 'sale',
          },
        })
      }

      return newSale
    })

    revalidatePath('/sales')
    revalidatePath('/dashboard')
    return {
      success: 'Venta registrada exitosamente',
      sale,
    }
  } catch (error: any) {
    console.error('Error creating sale:', error)
    return {
      error: error.message || 'Error al registrar la venta',
    }
  }
}

export async function getSalesStats(startDate?: Date, endDate?: Date) {
  const where = {
    ...(startDate && endDate && {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }),
  }

  const [totalSales, totalRevenue, salesByPaymentMethod, topProducts] = await Promise.all([
    prisma.sale.count({ where }),
    prisma.sale.aggregate({
      where,
      _sum: {
        total: true,
      },
    }),
    prisma.sale.groupBy({
      by: ['paymentMethod'],
      where,
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    }),
    prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: where,
      },
      _sum: {
        quantity: true,
        total: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    }),
  ])

  // Get product details for top products
  const productIds = topProducts.map(item => item.productId)
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  })

  const topProductsWithDetails = topProducts.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId),
  }))

  return {
    totalSales,
    totalRevenue: totalRevenue._sum.total || 0,
    salesByPaymentMethod,
    topProducts: topProductsWithDetails,
  }
}

export async function getDailySales(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by day
  const salesByDay = sales.reduce((acc, sale) => {
    const date = sale.createdAt.toISOString().split('T')[0]
    if (!acc[date]) {
      acc[date] = 0
    }
    acc[date] += sale.total
    return acc
  }, {} as Record<string, number>)

  // Fill missing days with 0
  const result = []
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      total: salesByDay[dateStr] || 0,
    })
  }

  return result.reverse()
}
