import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Download, MapPin, Mail, Phone, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getSaleById } from '@/modules/sales/sales.actions'
import { formatCurrency } from '@/lib/format'
import { PrintInvoiceButton } from './print-button'

interface InvoicePageProps {
  params: Promise<{ id: string }>
}

export const dynamic = 'force-dynamic'

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params
  const sale = await getSaleById(id)

  if (!sale) notFound()

  const paymentMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH':
        return 'Efectivo'
      case 'CARD':
        return 'Tarjeta'
      case 'TRANSFER':
        return 'Transferencia'
      default:
        return method
    }
  }

  const companyName = sale.invoice?.companyName || 'Cilmax'
  const companyNit = sale.invoice?.companyNit || null
  const companyAddress = sale.invoice?.companyAddress || null
  const companyCity = sale.invoice?.companyCity || null
  const companyPhone = sale.invoice?.companyPhone || null
  const companyEmail = sale.invoice?.companyEmail || null
  const currency = sale.invoice?.currency || 'COP'

  const saleDate = new Date(sale.saleDate)
  const dateStr = saleDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = saleDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const companyLocation = [companyAddress, companyCity].filter(Boolean).join(', ')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-bold">Factura {sale.invoiceNumber}</h1>
          <p className="text-sm text-muted-foreground">Vista previa e impresión de la factura</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/sales/${sale.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <a href={`/api/sales/${sale.id}/pdf`}>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
          </a>
          <PrintInvoiceButton />
        </div>
      </div>

      <div className="invoice-sheet mx-auto max-w-[820px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        {/* Accent bar (brand) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-teal-600 via-teal-500 to-amber-400" />

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 px-8 pt-8">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <Image
                src="/logo cilmax.png"
                alt="Cilmax"
                width={320}
                height={64}
                priority
                className="h-14 w-auto object-contain"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{companyName}</h2>
              <p className="mt-0.5 text-sm font-medium text-teal-700">FACTURA DE VENTA</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Factura N°</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">#{sale.invoiceNumber}</p>
            <div className="mt-2 flex flex-col items-end gap-1 text-xs text-slate-500">
              <span>{dateStr}</span>
              <span>{timeStr}</span>
            </div>
          </div>
        </div>

        {/* Company contact strip */}
        <div className="mx-8 mt-6 rounded-md border border-gray-200 bg-gray-50/60 px-5 py-3">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
            {companyNit && (
              <span className="inline-flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5 text-teal-600" />
                NIT: {companyNit}
              </span>
            )}
            {companyLocation && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-teal-600" />
                {companyLocation}
              </span>
            )}
            {companyPhone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-teal-600" />
                {companyPhone}
              </span>
            )}
            {companyEmail && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-teal-600" />
                {companyEmail}
              </span>
            )}
          </div>
        </div>

        {/* Meta: Client + payment */}
        <div className="mt-8 grid grid-cols-1 gap-6 px-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Cliente</p>
            {sale.client ? (
              <div className="mt-1.5">
                <p className="font-semibold text-slate-900">{sale.client.name}</p>
                {sale.client.phone && <p className="mt-0.5 text-sm text-slate-500">Tel: {sale.client.phone}</p>}
                {sale.client.email && <p className="text-sm text-slate-500">{sale.client.email}</p>}
                {sale.client.address && <p className="text-sm text-slate-500">{sale.client.address}</p>}
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-slate-500">Cliente general</p>
            )}
          </div>
          <div className="sm:text-right">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Método de pago</p>
            <p className="mt-1.5 font-semibold text-slate-900">{paymentMethodLabel(sale.paymentMethod)}</p>
          </div>
        </div>

        {/* Items table */}
        <div className="mt-8 px-8">
          <table className="w-full">
            <thead>
              <tr className="bg-teal-50 text-left text-[11px] font-semibold tracking-wide text-teal-800 uppercase">
                <th className="rounded-l-md px-3 py-2.5">Producto</th>
                <th className="px-3 py-2.5 text-center">Cant.</th>
                <th className="px-3 py-2.5 text-right">Precio Unit.</th>
                <th className="rounded-r-md px-3 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100">
                  <td className="px-3 py-3 text-sm font-medium text-slate-900">{item.product.name}</td>
                  <td className="px-3 py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                  <td className="px-3 py-3 text-right text-sm text-slate-600">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900">
                    {formatCurrency(item.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end px-8 pt-6">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(sale.subtotal, currency)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Descuento</span>
                <span>-{formatCurrency(sale.discount, currency)}</span>
              </div>
            )}
            <div className="flex items-center justify-between rounded-md border-t-2 border-teal-600 bg-teal-50/70 px-3 py-2.5">
              <span className="text-base font-bold text-slate-900">TOTAL</span>
              <span className="text-lg font-bold text-teal-700">{formatCurrency(sale.total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes / warranty */}
        <div className="mt-8 px-8">
          <div className="rounded-md border border-dashed border-gray-300 px-4 py-3 text-xs text-slate-400">
            Conserve esta factura para efectos de garantía del producto.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 border-t border-gray-200 bg-gray-50/60 px-8 py-5 text-center">
          <p className="text-sm font-medium text-slate-700">
            Cilmax — ¡Gracias por tu compra! <span className="text-teal-700">Dios te bendiga.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
