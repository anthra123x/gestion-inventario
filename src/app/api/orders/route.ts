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

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } })
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product?.name || 'producto'}` },
          { status: 409 }
        )
      }
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
      const newOrder = await tx.order.create({
        data: {
          clientName,
          clientPhone,
          clientEmail: clientEmail || null,
          clientCity: clientCity || null,
          clientAddress: clientAddress || null,
          clientNotes: clientNotes || null,
          subtotal: subtotal || 0,
          shipping: shipping || 0,
          total,
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear el pedido' },
      { status: 500 }
    )
  }
}
