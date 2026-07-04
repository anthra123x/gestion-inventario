import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/modules/auth/auth.actions'
import { generateRepairPdf, type PDFSettings } from '@/lib/pdf'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  await requireAuth()

  const [repair, settings] = await Promise.all([
    prisma.repair.findUnique({
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
    }),
    prisma.systemSettings.findFirst(),
  ])

  if (!repair) {
    return new Response('Reparación no encontrada', { status: 404 })
  }

  const pdfSettings: PDFSettings | undefined = settings
    ? {
        companyName: settings.companyName,
        receiptTagline: settings.receiptTagline,
        receiptTitle: settings.receiptTitle,
        warrantyText: settings.warrantyText,
        invoicePrefix: settings.invoicePrefix,
        receiptFooter: settings.receiptFooter,
        defaultWarrantyDays: settings.defaultWarrantyDays,
        currency: settings.currency,
      }
    : undefined

  const pdf = generateRepairPdf(repair, pdfSettings)

  return new Response(Buffer.from(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="ficha-tecnica-${repair.id.slice(-6)}.pdf"`,
    },
  })
}
