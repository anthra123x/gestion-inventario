'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { getSaleById } from '@/modules/sales/sales.actions'
import { PaymentMethod } from '@prisma/client'
import { ArrowLeft, Printer, X } from 'lucide-react'
import { formatCurrency } from '@/lib/format'

function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
  }
  return labels[method] || method
}

export default function SalePrintPage() {
  const params = useParams()
  const router = useRouter()
  const [sale, setSale] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSale()
  }, [params.id])

  async function loadSale() {
    try {
      const data = await getSaleById(params.id as string)
      setSale(data)
    } catch (err: any) {
      setError('Error al cargar la venta')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  function handleClose() {
    router.push('/sales')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando factura...</p>
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Venta no encontrada'}</p>
          <Button onClick={handleClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    )
  }

  const clientData = sale.client || {
    name: sale.clientName || 'Cliente',
    phone: sale.clientPhone || '',
    email: sale.clientEmail || '',
    address: sale.clientAddress || '',
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Floating Action Buttons - NO PRINT */}
      <div className="fixed top-4 right-4 flex gap-2 no-print z-50">
        <Button onClick={handlePrint} size="lg">
          <Printer className="mr-2 h-4 w-4" />
          Imprimir
        </Button>
        <Button onClick={handleClose} variant="outline" size="lg">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Invoice Container */}
      <div className="flex items-center justify-center p-8">
        <div className="bg-white w-full max-w-4xl shadow-lg">
          {/* Header */}
          <div className="border-b-2 border-gray-900 p-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">TECHNICELL</h1>
                <p className="text-gray-600 mt-1">Sistema de Gestión</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-gray-900">FACTURA</h2>
                <p className="text-gray-600 mt-1">
                  #{sale.id.slice(-6).toUpperCase()}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(sale.createdAt).toLocaleDateString('es-CO')} at {new Date(sale.createdAt).toLocaleTimeString('es-CO')}
                </p>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">DATOS DEL CLIENTE</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">{clientData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium text-gray-900">{clientData.phone || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{clientData.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium text-gray-900">{clientData.address || '-'}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Método de Pago</p>
              <p className="font-medium text-gray-900">{getPaymentMethodLabel(sale.paymentMethod)}</p>
            </div>
          </div>

          {/* Products Table */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">PRODUCTOS</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Producto</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-900">Cantidad</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Precio Unit.</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900">Total</th>
                </tr>
              </thead>
              <tbody>
                {sale.saleItems.map((item: any) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-900">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-gray-500">TOTAL</p>
                <p className="text-4xl font-bold text-gray-900">{formatCurrency(sale.total)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {sale.notes && (
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">NOTAS</h3>
              <p className="text-gray-600">{sale.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="p-8 bg-gray-50">
            <div className="text-center">
              <p className="text-gray-600 font-medium">Gracias por su compra</p>
              <p className="text-sm text-gray-500 mt-2">
                Factura generada el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}
              </p>
              <p className="text-xs text-gray-400 mt-4">Generado por Tecnicell - Sistema de Gestión</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .min-h-screen {
            min-height: auto !important;
          }

          .bg-gray-100 {
            background: white !important;
          }

          .p-8 {
            padding: 1.5rem !important;
          }

          .text-3xl {
            font-size: 1.5rem !important;
          }

          .text-2xl {
            font-size: 1.25rem !important;
          }

          .text-4xl {
            font-size: 2rem !important;
          }

          .shadow-lg {
            box-shadow: none !important;
          }

          .max-w-4xl {
            max-width: 100% !important;
          }

          /* Asegurar que la tabla tenga bordes al imprimir */
          table {
            border-collapse: collapse !important;
          }

          th, td {
            border: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  )
}
