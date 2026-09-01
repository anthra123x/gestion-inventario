import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
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
  const companyAddress = sale.invoice?.companyAddress || null
  const companyPhone = sale.invoice?.companyPhone || null
  const companyEmail = sale.invoice?.companyEmail || null
  const currency = sale.invoice?.currency || 'COP'
  const invoiceFooter = sale.invoice?.invoiceFooter || `${companyName} — Gracias por su compra`

  const saleDate = new Date(sale.saleDate)

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

      <div className="invoice-sheet mx-auto max-w-[820px] rounded-lg border bg-white p-8 shadow-sm">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-900 text-sm font-bold text-white">
                {companyName.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{companyName}</h2>
                {companyAddress && <p className="text-sm text-slate-500">{companyAddress}</p>}
                {(companyPhone || companyEmail) && (
                  <p className="text-xs text-slate-400">
                    {companyPhone && `Tel: ${companyPhone}`}
                    {companyPhone && companyEmail && ' | '}
                    {companyEmail && `Email: ${companyEmail}`}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block rounded border border-slate-300 px-3 py-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
              Factura de venta
            </span>
            <p className="mt-2 text-2xl font-bold text-slate-900">#{sale.invoiceNumber}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b py-5">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Cliente</p>
            {sale.client ? (
              <div className="mt-1">
                <p className="font-medium text-slate-900">{sale.client.name}</p>
                {sale.client.phone && <p className="text-sm text-slate-500">Tel: {sale.client.phone}</p>}
                {sale.client.email && <p className="text-sm text-slate-500">{sale.client.email}</p>}
                {sale.client.address && <p className="text-sm text-slate-500">{sale.client.address}</p>}
              </div>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Cliente general</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Fecha</p>
            <p className="mt-1 font-medium text-slate-900">
              {saleDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="text-sm text-slate-500">
              {saleDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="mt-2 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">Pago</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{paymentMethodLabel(sale.paymentMethod)}</p>
          </div>
        </div>

        {/* Items */}
        <div className="py-5">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 text-left text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
                <th className="py-2">Producto</th>
                <th className="py-2 text-center">Cant.</th>
                <th className="py-2 text-right">Precio Unit.</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3 text-sm font-medium text-slate-900">{item.product.name}</td>
                  <td className="py-3 text-center text-sm text-slate-600">{item.quantity}</td>
                  <td className="py-3 text-right text-sm text-slate-600">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-slate-900">
                    {formatCurrency(item.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
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
            <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-bold text-slate-900">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 border-t border-slate-200 pt-4 text-center text-sm font-medium text-slate-700">
          {invoiceFooter}
        </p>
      </div>
    </div>
  )
}
