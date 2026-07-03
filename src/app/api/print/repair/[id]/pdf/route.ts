import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/modules/auth/auth.actions'
import { generateRepairPdf } from '@/lib/pdf'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await requireAuth()

  const repair = await prisma.repair.findUnique({
    where: { id },
    include: {
      client: true,
      repairParts: {
        include: {
          part: true,
        },
      },
      user: {
        select: { name: true },
      },
    },
  })

  if (!repair) {
    return new Response('Reparación no encontrada', { status: 404 })
  }

  const pdf = generateRepairPdf(repair)

  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ficha-tecnica-${repair.id.slice(-6)}.pdf"`,
    },
  })
}
