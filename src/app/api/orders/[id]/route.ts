import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { externalReference: id }],
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                salePrice: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (_error) {
    return NextResponse.json({ error: 'Error al obtener el pedido' }, { status: 500 })
  }
}
