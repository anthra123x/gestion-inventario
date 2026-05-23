'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateSaleSchema } from '@/lib/validations'
import { checkStockAvailability } from '@/lib/stock-check'
import { getZodErrorMessage } from '@/lib/zod-error'
import { validateSaleItemData, validateSalePriceAgainstCost } from '@/lib/validations-data'
import { calcSubtotal, calcDiscountAmount, calcTotal, calcCost, calcProfit } from '@/lib/finance'
import { PaymentMethod } from '@prisma/client'
import { requireAdmin } from '@/modules/auth/auth.actions'

/**
 * Obtiene lista de ventas con filtros opcionales
 * @param search - Texto para buscar en cliente, teléfono o notas
 * @param startDate - Fecha inicial para filtrar por fecha de venta
 * @param endDate - Fecha final para filtrar por fecha de venta
 * @returns Lista de ventas con información de cliente y usuario
 */
export async function getSales(search?: string, startDate?: Date, endDate?: Date, page = 1, take = 20) {
  await requireAdmin()
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
  await requireAdmin()
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
  await requireAdmin()
  const itemsJson = formData.get('items') as string

  let items
  try {
    items = JSON.parse(itemsJson)
  } catch {
    return {
      error: 'Datos de productos inválidos',
    }
  }

  const discountPercentRaw = formData.get('discountPercent') || '0'
  let discountPercent = 0
  try {
    discountPercent = parseFloat(String(discountPercentRaw))
    if (isNaN(discountPercent)) discountPercent = 0
  } catch {
    discountPercent = 0
  }

  const validatedFields = CreateSaleSchema.safeParse({
    clientId: formData.get('clientId') || null,
    clientName: formData.get('clientName') || null,
    clientPhone: formData.get('clientPhone') || null,
    clientEmail: formData.get('clientEmail') || null,
    clientAddress: formData.get('clientAddress') || null,
    items,
    discountPercent,
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
    let { clientId, clientName, clientPhone, clientEmail, clientAddress, items, discountPercent: discountPct, paymentMethod, notes } = validatedFields.data

    // Find or create client by phone (same pattern as createRepair)
    if (!clientId && (clientName || clientPhone)) {
      try {
        if (clientPhone) {
          const existingClient = await prisma.client.findFirst({
            where: { phone: clientPhone, deletedAt: null },
          })
          if (existingClient) {
            clientId = existingClient.id
          }
        }
        if (!clientId && clientName) {
          const newClient = await prisma.client.create({
            data: {
              name: clientName,
              phone: clientPhone || null,
              email: clientEmail || null,
              address: clientAddress || null,
            },
          })
          clientId = newClient.id
        }
      } catch (err: any) {
        return { error: `Error al procesar el cliente: ${err.message}` }
      }
    }

    // Fetch all product costs upfront
    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, purchasePrice: true, name: true },
    })
    const productMap = new Map(products.map(p => [p.id, { purchasePrice: p.purchasePrice, name: p.name }]))

    // Validate no item generates loss
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (product) {
        const validation = validateSalePriceAgainstCost(item.unitPrice, product.purchasePrice)
        if (!validation.ok) {
          return { error: validation.message }
        }
      }
    }

    const subtotal = calcSubtotal(items)
    const discountAmount = calcDiscountAmount(subtotal, discountPct)
    const total = calcTotal(subtotal, discountPct)
    const cost = calcCost(items.map(item => ({
      unitCost: productMap.get(item.productId)?.purchasePrice || 0,
      quantity: item.quantity,
    })))

    const saleProfit = calcProfit(subtotal, cost, discountPct)
    if (saleProfit < 0) {
      return { error: 'La venta genera pérdida después de aplicar el descuento. Ajusta el precio o el descuento.' }
    }

    // Use transaction for atomicity
    const sale = await prisma.$transaction(async (tx) => {
      // Check stock availability
      await checkStockAvailability(tx, items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })))

      // Create sale with client data
      const newSale = await tx.sale.create({
        data: {
          clientId,
          clientName,
          clientPhone,
          clientEmail,
          clientAddress,
          total,
          discountPercent: discountPct,
          discountAmount,
          paymentMethod,
          notes,
          saleItems: {
            create: items.map(item => {
              const purchasePrice = productMap.get(item.productId)?.purchasePrice || 0
              const itemSubtotal = item.unitPrice * item.quantity
              const itemDiscount = discountPct > 0 ? discountAmount * (itemSubtotal / subtotal) : 0
              const effectiveItemTotal = itemSubtotal - itemDiscount
              const itemProfit = effectiveItemTotal - (purchasePrice * item.quantity)

              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: effectiveItemTotal,
                purchasePriceAtSale: purchasePrice,
                profit: itemProfit,
              }
            }),
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
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })

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
  await requireAdmin()
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
      deletedAt: null,
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
  await requireAdmin()
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
    take: 1000,
  })

  const salesByDay: Record<string, number> = {}
  for (const sale of sales) {
    const date = sale.createdAt.toISOString().split('T')[0]
    salesByDay[date] = (salesByDay[date] || 0) + sale.total
  }

  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    result.push({
      date: dateStr,
      total: salesByDay[dateStr] || 0,
    })
  }

  return result
}
