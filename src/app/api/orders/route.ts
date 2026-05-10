import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const { clientName, clientPhone, clientEmail, clientAddress, clientNotes, subtotal, shipping, total, externalReference, items } = body

    if (!clientName || !clientPhone || !items?.length) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: clientName, clientPhone, items' },
        { status: 400 }
      )
    }

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
          clientAddress: clientAddress || null,
          clientNotes: clientNotes || null,
          subtotal: subtotal || 0,
          shipping: shipping || 0,
          total,
          externalReference: externalReference || null,
          items: {
            create: items.map((item: any) => ({
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