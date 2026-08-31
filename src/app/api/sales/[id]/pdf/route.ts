import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSaleInvoicePdf } from '@/lib/pdf'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      client: true,
      items: { include: { product: true } },
      invoice: true,
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!sale) {
    return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  }

  const settings = await prisma.systemSettings.findFirst()

  const pdfBytes = generateSaleInvoicePdf(
    {
      id: sale.id,
      invoiceNumber: sale.invoiceNumber,
      subtotal: sale.subtotal,
      discount: sale.discount,
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      saleDate: sale.saleDate,
      client: sale.client,
      items: sale.items,
      user: sale.user,
      invoice: sale.invoice,
    },
    settings
      ? {
          companyName: settings.companyName,
          companyAddress: settings.companyAddress,
          companyPhone: settings.companyPhone,
          companyEmail: settings.companyEmail,
          invoicePrefix: settings.invoicePrefix,
          invoiceFooter: settings.invoiceFooter,
          currency: settings.currency,
        }
      : undefined,
  )

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="factura-${sale.invoiceNumber}.pdf"`,
    },
  })
}
