'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateOrderSchema, UpdateOrderStatusSchema } from '@/lib/validations'
import { getZodErrorMessage } from '@/lib/zod-error'
import { OrderStatus } from '@prisma/client'

export async function getOrders(search?: string, status?: OrderStatus, page = 1, take = 20) {
  const where = {
    ...(search && {
      OR: [
        { clientName: { contains: search, mode: 'insensitive' as const } },
        { clientPhone: { contains: search, mode: 'insensitive' as const } },
        { externalReference: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(status && { status }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        status: true,
        subtotal: true,
        shipping: true,
        total: true,
        externalReference: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  return {
    orders,
    total,
    page,
    totalPages: Math.ceil(total / take),
  }
}

export async function getOrderById(id: string) {
  return await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, salePrice: true } } },
      },
    },
  })
}

export async function getOrderByExternalReference(ref: string) {
  return await prisma.order.findUnique({
    where: { externalReference: ref },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, salePrice: true } } },
      },
    },
  })
}

export async function getOrderStats() {
  const [total, pending, confirmed, preparing, shipped, delivered, cancelled, revenue] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'CONFIRMED' } }),
    prisma.order.count({ where: { status: 'PREPARING' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { total: true },
    }),
  ])

  return {
    total,
    pending,
    confirmed,
    preparing,
    shipped,
    delivered,
    cancelled,
    totalRevenue: revenue._sum.total || 0,
  }
}

export async function createOrder(formData: FormData) {
  const itemsJson = formData.get('items') as string
  let rawItems: any[]
  try {
    rawItems = itemsJson ? JSON.parse(itemsJson) : []
  } catch {
    return { error: 'Datos de productos inválidos' }
  }

  const items = rawItems.map((item: any) => ({
    productId: item.productId,
    quantity: isNaN(Number(item.quantity)) ? 1 : Number(item.quantity),
    unitPrice: isNaN(Number(item.unitPrice)) ? 0 : Number(item.unitPrice),
  }))

  const validatedFields = CreateOrderSchema.safeParse({
    clientName: formData.get('clientName'),
    clientPhone: formData.get('clientPhone'),
    clientEmail: formData.get('clientEmail') || null,
    clientCity: formData.get('clientCity') || null,
    clientAddress: formData.get('clientAddress') || null,
    clientNotes: formData.get('clientNotes') || null,
    subtotal: formData.get('subtotal'),
    shipping: formData.get('shipping') || 0,
    total: formData.get('total'),
    externalReference: formData.get('externalReference') || null,
    items,
  })

  if (!validatedFields.success) {
    return { error: getZodErrorMessage(validatedFields) }
  }

  for (const item of validatedFields.data.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product || product.stock < item.quantity) {
      return { error: `Stock insuficiente para ${product?.name || 'producto'}` }
    }
  }

  try {
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          clientName: validatedFields.data.clientName,
          clientPhone: validatedFields.data.clientPhone,
          clientEmail: validatedFields.data.clientEmail,
          clientCity: validatedFields.data.clientCity,
          clientAddress: validatedFields.data.clientAddress,
          clientNotes: validatedFields.data.clientNotes,
          subtotal: validatedFields.data.subtotal,
          shipping: validatedFields.data.shipping,
          total: validatedFields.data.total,
          externalReference: validatedFields.data.externalReference,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.unitPrice * item.quantity,
            })),
          },
        },
        include: { items: true },
      })

      return newOrder
    })

    revalidatePath('/orders')
    return { success: 'Pedido creado exitosamente', order }
  } catch (error: any) {
    return { error: error.message || 'Error al crear el pedido' }
  }
}

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

const STATUS_WITH_STOCK_DECREMENTED: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED']

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const validated = UpdateOrderStatusSchema.safeParse({ status })
  if (!validated.success) {
    return { error: 'Estado inválido' }
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    })

    if (!order) return { error: 'Pedido no encontrado' }

    const allowed = ALLOWED_TRANSITIONS[order.status]
    if (!allowed.includes(status)) {
      return { error: `Transición inválida: ${order.status} → ${status}` }
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: { status },
      })

      const becomesConfirmed = status === 'CONFIRMED' && order.status === 'PENDING'

      if (becomesConfirmed) {
        for (const item of order.items) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true },
          })
          if (!product || product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para confirmar pedido`)
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              type: 'EXIT',
              quantity: item.quantity,
              reason: `Pedido online #${orderId.slice(-6)}`,
              referenceId: orderId,
              referenceType: 'order',
            },
          })
        }
      }

      if (status === 'CANCELLED') {
        const hadStockDecremented = STATUS_WITH_STOCK_DECREMENTED.includes(order.status)
        if (hadStockDecremented) {
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                type: 'ENTRY',
                quantity: item.quantity,
                reason: `Cancelación pedido #${orderId.slice(-6)}`,
                referenceId: orderId,
                referenceType: 'order',
              },
            })
          }
        }
      }
    })

    revalidatePath('/orders')
    revalidatePath(`/orders/${orderId}`)
    return { success: 'Estado actualizado exitosamente' }
  } catch (error: any) {
    return { error: error.message || 'Error al actualizar el estado' }
  }
}

export async function updateOrderNotes(orderId: string, internalNotes: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { internalNotes: internalNotes || null },
    })
    revalidatePath(`/orders/${orderId}`)
    return { success: 'Notas actualizadas' }
  } catch (error: any) {
    return { error: error.message || 'Error al actualizar las notas' }
  }
}

export async function getOrdersByStatus(status: OrderStatus) {
  return await prisma.order.findMany({
    where: { status },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      clientName: true,
      total: true,
      status: true,
      createdAt: true,
      _count: { select: { items: true } },
    },
  })
}