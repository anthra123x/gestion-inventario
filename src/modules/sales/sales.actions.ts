'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateSaleSchema } from '@/lib/validations'
import { checkStockAvailability } from '@/lib/stock-check'
import { getZodErrorMessage } from '@/lib/zod-error'
import { validateSaleItemData } from '@/lib/validations-data'
import { PaymentMethod } from '@prisma/client'

/**
 * Obtiene lista de ventas con filtros opcionales
 * @param search - Texto para buscar en cliente, teléfono o notas
 * @param startDate - Fecha inicial para filtrar por fecha de venta
 * @param endDate - Fecha final para filtrar por fecha de venta
 * @returns Lista de ventas con información de cliente y usuario
 */
export async function getSales(search?: string, startDate?: Date, endDate?: Date, page = 1, take = 20) {
  const where = {
    ...(search && {
      OR: [
        { client: { name: { contains: search, mode: 'insensitive' as const } } },
        { client: { phone: { contains: search, mode: 'insensitive' as const } } },
        { clientName: { contains: search, mode: 'insensitive' as const } },
        { clientPhone: { contains: search, mode: 'insensitive' as const } },
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

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        total: true,
        paymentMethod: true,
        notes: true,
        createdAt: true,
        clientName: true,
        clientPhone: true,
        clientEmail: true,
        clientAddress: true,
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            saleItems: true,
          },
        },
      },
    }),
    prisma.sale.count({ where }),
  ])

  return {
    sales,
    total,
    page,
    totalPages: Math.ceil(total / take),
  }
}

/**
 * Obtiene una venta por ID con todos sus detalles
 * @param id - ID de la venta
 * @returns Venta con items, productos, cliente y usuario
 */
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

/**
 * Crea una nueva venta con validaciones y transacciones
 * @param formData - Datos del formulario de venta
 * @returns Resultado de la operación con venta creada o error
 */
export async function createSale(formData: FormData) {
  const itemsJson = formData.get('items') as string

  let items
  try {
    items = JSON.parse(itemsJson)
  } catch {
    return {
      error: 'Datos de productos inválidos',
    }
  }

  const validatedFields = CreateSaleSchema.safeParse({
    clientId: formData.get('clientId') || null,
    clientName: formData.get('clientName') || null,
    clientPhone: formData.get('clientPhone') || null,
    clientEmail: formData.get('clientEmail') || null,
    clientAddress: formData.get('clientAddress') || null,
    items,
    paymentMethod: formData.get('paymentMethod') as PaymentMethod,
    notes: formData.get('notes') || null,
  })

  if (!validatedFields.success) {
    return {
      error: getZodErrorMessage(validatedFields),
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
    const { clientId, clientName, clientPhone, clientEmail, clientAddress, items, paymentMethod, notes } = validatedFields.data

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)

    // Use transaction for atomicity
    const sale = await prisma.$transaction(async (tx) => {
      // Check stock availability and capture purchase prices
      const productCosts: Record<string, number> = {}
      await checkStockAvailability(tx, items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })))

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          select: { purchasePrice: true },
        })
        if (product) {
          productCosts[item.productId] = product.purchasePrice
        }
      }

      // Create sale with client data
      const newSale = await tx.sale.create({
        data: {
          clientId,
          clientName,
          clientPhone,
          clientEmail,
          clientAddress,
          total,
          paymentMethod,
          notes,
          saleItems: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
              purchasePriceAtSale: productCosts[item.productId] || 0,
              profit: (item.unitPrice - (productCosts[item.productId] || 0)) * item.quantity,
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
    return {
      error: error.message || 'Error al registrar la venta',
    }
  }
}

/**
 * Obtiene estadísticas de ventas para el dashboard
 * @param startDate - Fecha inicial para filtrar estadísticas
 * @param endDate - Fecha final para filtrar estadísticas
 * @returns Estadísticas de ventas incluyendo total, revenue, top productos
 */
export async function getSalesStats(startDate?: Date, endDate?: Date) {
  const where = {
    ...(startDate && endDate && {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    }),
  }

  const [totalSales, totalRevenue, salesByPaymentMethod, topProducts, profitData] = await Promise.all([
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
    prisma.saleItem.aggregate({
      where: {
        sale: where,
      },
      _sum: {
        purchasePriceAtSale: true,
        profit: true,
      },
      _avg: {
        profit: true,
      },
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

  // Calculate total cost: sum of (purchasePriceAtSale * quantity)
  // We already have profit, so: totalCost = totalRevenue - totalProfit
  const totalProfit = profitData._sum.profit || 0
  const totalCost = (totalRevenue._sum.total || 0) - totalProfit

  return {
    totalSales,
    totalRevenue: totalRevenue._sum.total || 0,
    totalCost,
    totalProfit,
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
