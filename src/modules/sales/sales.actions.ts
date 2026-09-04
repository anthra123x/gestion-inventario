'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateSaleSchema } from '@/lib/validations'
import { requireAuth } from '@/modules/auth/auth.actions'
import { parseError } from '@/lib/errors'

export async function createSale(data: {
  clientId?: string | null
  items: Array<{ productId: string; quantity: number; unitPrice?: number }>
  discount?: number
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER'
}) {
  const user = await requireAuth()

  const validatedFields = CreateSaleSchema.safeParse({
    clientId: data.clientId || null,
    items: data.items,
    discount: data.discount || 0,
    paymentMethod: data.paymentMethod,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { items, clientId, discount, paymentMethod } = validatedFields.data

      // Validate stock for all items
      const productIds = items.map((i) => i.productId)
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
      })

      const productMap = new Map(products.map((p) => [p.id, p]))

      for (const item of items) {
        const product = productMap.get(item.productId)
        if (!product) throw new Error(`Producto ${item.productId} no encontrado`)
        if (product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para "${product.name}": disponible ${product.stock}, solicitado ${item.quantity}`,
          )
        }
      }

      // Get next invoice number
      const settings = await tx.systemSettings.findFirst()
      if (!settings) throw new Error('Configuración del sistema no encontrada')

      const invoiceNumber = `${settings.invoicePrefix}${settings.nextInvoiceNumber}`

      // Calculate totals
      let subtotal = 0
      const saleItemsData = items.map((item) => {
        const product = productMap.get(item.productId)!
        const unitPrice =
          item.unitPrice !== undefined && item.unitPrice >= 0 ? item.unitPrice : product.salePrice
        const total = unitPrice * item.quantity
        subtotal += total
        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice,
          total,
        }
      })

      const total = subtotal - (discount || 0)

      // Create sale
      const sale = await tx.sale.create({
        data: {
          invoiceNumber,
          clientId: clientId || null,
          subtotal,
          discount: discount || 0,
          total,
          paymentMethod,
          userId: user.id,
          items: {
            create: saleItemsData,
          },
        },
        include: { items: true },
      })

      // Create invoice snapshot
      await tx.invoice.create({
        data: {
          saleId: sale.id,
          invoiceNumber,
          companyName: settings.companyName,
          companyNit: settings.companyNit,
          companyAddress: settings.companyAddress,
          companyCity: settings.companyCity,
          companyPhone: settings.companyPhone,
          companyEmail: settings.companyEmail,
          currency: settings.currency,
          invoiceFooter: settings.invoiceFooter,
        },
      })

      // Update stock and create stock movements
      for (const item of items) {
        const product = productMap.get(item.productId)!
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity },
        })

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE',
            quantity: item.quantity,
            reference: invoiceNumber,
          },
        })
      }

      // Create income transaction
      await tx.transaction.create({
        data: {
          type: 'INCOME',
          amount: total,
          description: `Venta ${invoiceNumber}`,
          categoryId:
            (
              await tx.category.findFirst({
                where: { type: 'INCOME', name: { contains: 'Venta', mode: 'insensitive' } },
              })
            )?.id || '',
          saleId: sale.id,
        },
      })

      // Increment invoice number
      await tx.systemSettings.update({
        where: { id: settings.id },
        data: { nextInvoiceNumber: settings.nextInvoiceNumber + 1 },
      })

      return sale
    })

    revalidatePath('/sales')
    revalidatePath('/inventory')
    revalidatePath('/finances')
    revalidatePath('/dashboard')
    return { success: 'Venta registrada exitosamente', sale: result }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function deleteSale(saleId: string) {
  await requireAuth()

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({
        where: { id: saleId },
        include: { items: true },
      })

      if (!sale) throw new Error('Venta no encontrada')

      // Restore stock
      for (const item of sale.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'OUT',
            quantity: item.quantity,
            reference: `Eliminación ${sale.invoiceNumber}`,
          },
        })
      }

      // Delete linked income transaction so it no longer counts in finance/dashboard
      await tx.transaction.deleteMany({
        where: { saleId: saleId },
      })

      // Delete the sale (SaleItems and Invoice cascade via onDelete: Cascade)
      await tx.sale.delete({
        where: { id: saleId },
      })
    })

    revalidatePath('/sales')
    revalidatePath('/inventory')
    revalidatePath('/finances')
    revalidatePath('/dashboard')
    return { success: 'Venta eliminada exitosamente' }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function getSales(search?: string, page = 1, take = 20) {
  await requireAuth()

  const where = {
    ...(search && {
      OR: [
        { invoiceNumber: { contains: search, mode: 'insensitive' as const } },
        { client: { name: { contains: search, mode: 'insensitive' as const } } },
        { client: { phone: { contains: search, mode: 'insensitive' as const } } },
      ],
    }),
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy: { saleDate: 'desc' },
      skip: (page - 1) * take,
      take,
      include: {
        client: { select: { id: true, name: true, phone: true } },
        items: {
          include: { product: { select: { id: true, name: true } } },
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

export async function getSaleById(id: string) {
  await requireAuth()
  return await prisma.sale.findUnique({
    where: { id },
    include: {
      client: true,
      items: {
        include: { product: true },
      },
      invoice: true,
      user: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function getNextInvoiceNumber() {
  await requireAuth()
  const settings = await prisma.systemSettings.findFirst()
  if (!settings) return 'CIL-1'
  return `${settings.invoicePrefix}${settings.nextInvoiceNumber}`
}
