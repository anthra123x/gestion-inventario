import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { CreateOrderSchema } from '@/lib/validations'
import { getZodErrorMessage } from '@/lib/zod-error'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validated = CreateOrderSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { error: getZodErrorMessage(validated) },
        { status: 400 }
      )
    }

    const { clientName, clientPhone, clientEmail, clientCity, clientAddress, clientNotes, subtotal, shipping, total, externalReference, items } = validated.data

    // Fetch all products in one query
    const productIds = items.map(i => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, deletedAt: null },
      select: {
        id: true,
        name: true,
        stock: true,
        salePrice: true,
        purchasePrice: true,
        ecommerce: { select: { ecommercePrice: true, visible: true } },
      },
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    for (const item of items) {
      const product = productMap.get(item.productId)

      if (!product) {
        return NextResponse.json(
          { error: `Producto no encontrado o no disponible: ${item.productId}` },
          { status: 404 }
        )
      }

      if (!product.ecommerce || !product.ecommerce.visible) {
        return NextResponse.json(
          { error: `Producto no disponible para venta online: ${product.name}` },
          { status: 409 }
        )
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product.name}` },
          { status: 409 }
        )
      }

      // Validate unitPrice against DB price (prevent price manipulation)
      const expectedPrice = product.ecommerce.ecommercePrice || product.salePrice
      if (item.unitPrice !== expectedPrice) {
        return NextResponse.json(
          { error: `Precio inválido para ${product.name}. El precio debe ser ${expectedPrice}` },
          { status: 400 }
        )
      }
    }

    // Recalculate and validate total
    const computedSubtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
    const computedTotal = computedSubtotal + (shipping || 0)

    if (Math.abs(computedTotal - total) > 1) {
      return NextResponse.json(
        { error: 'El total no coincide con el subtotal más el envío' },
        { status: 400 }
      )
    }

    if (externalReference) {
      const existing = await prisma.order.findUnique({
        where: { externalReference },
      })
      if (existing) {
        return NextResponse.json(
          { error: `Ya existe un pedido con la referencia: ${externalReference}` },
          { status: 409 }
        )
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside transaction
      for (const item of items) {
        const current = await tx.product.findUnique({
          where: { id: item.productId },
          select: { stock: true },
        })
        if (!current || current.stock < item.quantity) {
          throw new Error(`Stock insuficiente para producto ${item.productId}`)
        }
      }

      const newOrder = await tx.order.create({
        data: {
          clientName,
          clientPhone,
          clientEmail: clientEmail || null,
          clientCity: clientCity || null,
          clientAddress: clientAddress || null,
          clientNotes: clientNotes || null,
          subtotal: computedSubtotal,
          shipping: shipping || 0,
          total: computedTotal,
          externalReference: externalReference || null,
          items: {
            create: items.map((item) => ({
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

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : null
    if (message?.startsWith('Stock insuficiente')) {
      return NextResponse.json({ error: message }, { status: 409 })
    }
    return NextResponse.json(
      { error: 'Error al crear el pedido' },
      { status: 500 }
    )
  }
}
