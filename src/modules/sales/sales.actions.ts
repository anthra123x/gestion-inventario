'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/modules/auth/auth.actions'
import { CreateSaleSchema, UpdateSaleSchema } from '@/lib/validations'
import { getZodErrorMessage } from '@/lib/zod-error'
import { logAudit } from '@/modules/audit/audit.service'
import { validateSaleItemData, validateSalePriceAgainstCost } from '@/lib/validations-data'
import { calcSubtotal, calcDiscountAmount, calcTotal, calcCost, calcProfit } from '@/lib/finance'
import { PaymentMethod } from '@prisma/client'
import { checkStockAvailability } from '@/lib/stock-check'
import { parseError } from '@/lib/errors'
import { formatCurrency } from '@/lib/format'
import { notifyUsers } from '@/modules/notifications/notifications.actions'

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
    deletedAt: null,
    ...(search && {
      OR: [
        { client: { name: { contains: search, mode: 'insensitive' as const } } },
        { client: { phone: { contains: search, mode: 'insensitive' as const } } },
        { clientName: { contains: search, mode: 'insensitive' as const } },
        { clientPhone: { contains: search, mode: 'insensitive' as const } },
        { notes: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(startDate &&
      endDate && {
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
  return await prisma.sale.findFirst({
    where: { id, deletedAt: null },
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
  } catch (validationError) {
    return { error: parseError(validationError).message }
  }

  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      clientAddress,
      items,
      discountPercent: discountPct,
      paymentMethod,
      notes,
    } = validatedFields.data
    let { clientId } = validatedFields.data

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
      } catch (err) {
        return { error: `Error al procesar el cliente: ${parseError(err).message}` }
      }
    }

    // Fetch all product costs upfront
    const productIds = items.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, purchasePrice: true, name: true },
    })
    const productMap = new Map(products.map((p) => [p.id, { purchasePrice: p.purchasePrice, name: p.name }]))

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
    const cost = calcCost(
      items.map((item) => ({
        unitCost: productMap.get(item.productId)?.purchasePrice || 0,
        quantity: item.quantity,
      })),
    )

    const saleProfit = calcProfit(subtotal, cost, discountPct)
    if (saleProfit < 0) {
      return { error: 'La venta genera pérdida después de aplicar el descuento. Ajusta el precio o el descuento.' }
    }

    // Use transaction for atomicity
    const sale = await prisma.$transaction(async (tx) => {
      // Check stock availability
      await checkStockAvailability(
        tx,
        items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      )

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
            create: items.map((item) => {
              const purchasePrice = productMap.get(item.productId)?.purchasePrice || 0
              const itemSubtotal = item.unitPrice * item.quantity
              const itemDiscount = discountPct > 0 ? discountAmount * (itemSubtotal / subtotal) : 0
              const effectiveItemTotal = itemSubtotal - itemDiscount
              const itemProfit = effectiveItemTotal - purchasePrice * item.quantity

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

    const LARGE_SALE_THRESHOLD = 1_000_000
    if (sale.total >= LARGE_SALE_THRESHOLD) {
      notifyUsers('SALE_COMPLETED', 'Venta de alto valor', `Venta #${sale.id.slice(-6)} por ${formatCurrency(sale.total)}`, 'sale', sale.id)
    }

    revalidatePath('/sales')
    revalidatePath('/dashboard')
    return {
      success: 'Venta registrada exitosamente',
      sale,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

/**
 * Elimina una venta (soft delete) y restaura el stock
 */
export async function deleteSale(id: string) {
  await requireAdmin()

  const sale = await prisma.sale.findFirst({
    where: { id, deletedAt: null },
    include: {
      saleItems: { select: { productId: true, quantity: true } },
    },
  })
  if (!sale) return { error: 'Venta no encontrada' }

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of sale.saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }

      await tx.inventoryMovement.deleteMany({
        where: { referenceId: id, referenceType: 'sale' },
      })

      await tx.sale.update({
        where: { id },
        data: { deletedAt: new Date() },
      })
    })

    revalidatePath('/sales')
    revalidatePath('/dashboard')
    logAudit('DELETE', 'sale', id)
    return { success: 'Venta eliminada exitosamente. El stock ha sido restaurado.' }
  } catch (_error) {
    return { error: 'Error al eliminar la venta' }
  }
}

/**
 * Actualiza una venta existente
 */
export async function updateSale(id: string, formData: FormData) {
  await requireAdmin()

  const sale = await prisma.sale.findFirst({
    where: { id, deletedAt: null },
    include: {
      saleItems: { select: { productId: true, quantity: true } },
    },
  })
  if (!sale) return { error: 'Venta no encontrada' }

  const itemsJson = formData.get('items') as string
  let items
  try {
    items = JSON.parse(itemsJson)
  } catch {
    return { error: 'Datos de productos inválidos' }
  }

  const discountPercentRaw = formData.get('discountPercent') || '0'
  let discountPercent = 0
  try {
    discountPercent = parseFloat(String(discountPercentRaw))
    if (isNaN(discountPercent)) discountPercent = 0
  } catch {
    discountPercent = 0
  }

  const validatedFields = UpdateSaleSchema.safeParse({
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
    return { error: getZodErrorMessage(validatedFields) }
  }

  try {
    for (const item of validatedFields.data.items) {
      validateSaleItemData({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.unitPrice * item.quantity,
      })
    }
  } catch (validationError) {
    return { error: parseError(validationError).message }
  }

  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      clientAddress,
      items: newItems,
      discountPercent: discountPct,
      paymentMethod,
      notes,
    } = validatedFields.data
    let { clientId } = validatedFields.data

    if (!clientId && (clientName || clientPhone)) {
      try {
        if (clientPhone) {
          const existingClient = await prisma.client.findFirst({
            where: { phone: clientPhone, deletedAt: null },
          })
          if (existingClient) clientId = existingClient.id
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
      } catch (err) {
        return { error: `Error al procesar el cliente: ${parseError(err).message}` }
      }
    }

    const productIds = newItems.map((item) => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: { id: true, purchasePrice: true, name: true },
    })
    const productMap = new Map(products.map((p) => [p.id, { purchasePrice: p.purchasePrice, name: p.name }]))

    for (const item of newItems) {
      const product = productMap.get(item.productId)
      if (product) {
        const validation = validateSalePriceAgainstCost(item.unitPrice, product.purchasePrice)
        if (!validation.ok) return { error: validation.message }
      }
    }

    const subtotal = calcSubtotal(newItems)
    const discountAmount = calcDiscountAmount(subtotal, discountPct)
    const total = calcTotal(subtotal, discountPct)
    const cost = calcCost(
      newItems.map((item) => ({
        unitCost: productMap.get(item.productId)?.purchasePrice || 0,
        quantity: item.quantity,
      })),
    )

    const saleProfit = calcProfit(subtotal, cost, discountPct)
    if (saleProfit < 0) {
      return {
        error:
          'La venta genera pérdida después de aplicar el descuento. Ajusta el precio o el descuento.',
      }
    }

    const updatedSale = await prisma.$transaction(async (tx) => {
      for (const oldItem of sale.saleItems) {
        await tx.product.update({
          where: { id: oldItem.productId },
          data: { stock: { increment: oldItem.quantity } },
        })
      }

      await tx.inventoryMovement.deleteMany({
        where: { referenceId: id, referenceType: 'sale' },
      })
      await tx.saleItem.deleteMany({
        where: { saleId: id },
      })

      await checkStockAvailability(
        tx,
        newItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      )

      const updated = await tx.sale.update({
        where: { id },
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
            create: newItems.map((item) => {
              const purchasePrice = productMap.get(item.productId)?.purchasePrice || 0
              const itemSubtotal = item.unitPrice * item.quantity
              const itemDiscount =
                discountPct > 0 ? discountAmount * (itemSubtotal / subtotal) : 0
              const effectiveItemTotal = itemSubtotal - itemDiscount
              const itemProfit = effectiveItemTotal - purchasePrice * item.quantity

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
            include: { product: true },
          },
        },
      })

      for (const item of newItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            type: 'EXIT',
            quantity: item.quantity,
            reason: `Venta #${id}`,
            referenceId: id,
            referenceType: 'sale',
          },
        })
      }

      return updated
    })

    revalidatePath('/sales')
    revalidatePath('/dashboard')
    return { success: 'Venta actualizada exitosamente', sale: updatedSale }
  } catch (error) {
    return { error: parseError(error).message }
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
    deletedAt: null,
    ...(startDate &&
      endDate && {
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
  const productIds = topProducts.map((item) => item.productId)
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

  const topProductsWithDetails = topProducts.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
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
