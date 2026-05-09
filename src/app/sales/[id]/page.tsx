'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react'
import { getSaleById } from '@/modules/sales/sales.actions'
import { PaymentMethod } from '@prisma/client'
import { formatCurrency } from '@/lib/format'

function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
  }
  return labels[method] || method
}

function getPaymentMethodColor(method: PaymentMethod): string {
  const colors: Record<PaymentMethod, string> = {
    CASH: 'default',
    CARD: 'secondary',
    TRANSFER: 'outline',
  }
  return colors[method] || 'default'
}

export default function SaleDetailPage() {
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

  if (loading) {
    return (
      <div className="container mx-auto py-6 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
            <p className="mt-2 text-gray-600">Cargando factura...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="container mx-auto py-6 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-2 text-gray-600">{error || 'Venta no encontrada'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
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
    <div className="container mx-auto py-6 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="flex gap-2 no-print">
            <Button onClick={() => router.push(`/print/${params.id}`)} variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir Factura
            </Button>
          </div>
        </div>

        {/* Invoice */}
        <Card className="print:shadow-none print:border print:border-gray-300">
          <CardHeader className="print:px-4 print:py-2 print:border-b print:border-gray-300">
            <div className="flex justify-between items-start">
              <div className="print:w-1/2">
                <CardTitle className="text-2xl print:text-xl">Factura #{sale.id.slice(-6).toUpperCase()}</CardTitle>
                <CardDescription className="print:text-sm">
                  Fecha: {new Date(sale.createdAt).toLocaleDateString('es-CO')} at {new Date(sale.createdAt).toLocaleTimeString('es-CO')}
                </CardDescription>
              </div>
              <div className="print:w-1/2 print:text-right">
                <Badge variant={getPaymentMethodColor(sale.paymentMethod) as any} className="print:inline-block print:border print:border-gray-300">
                  {getPaymentMethodLabel(sale.paymentMethod)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 print:px-4 print:py-4">
            {/* Client Info */}
            <div className="space-y-2 print:border print:border-gray-300 print:p-4 print:rounded">
              <h3 className="font-semibold text-lg print:text-base print:border-b print:border-gray-300 print:pb-2">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-4 print:grid-cols-4 print:gap-2">
                <div>
                  <p className="text-sm text-gray-500 print:text-xs">Nombre</p>
                  <p className="font-medium print:text-sm">{clientData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 print:text-xs">Teléfono</p>
                  <p className="font-medium print:text-sm">{clientData.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 print:text-xs">Email</p>
                  <p className="font-medium print:text-sm">{clientData.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 print:text-xs">Dirección</p>
                  <p className="font-medium print:text-sm">{clientData.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg print:text-base print:border-b print:border-gray-300 print:pb-2">Productos</h3>
              <div className="print:border print:border-gray-300 print:rounded print:overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="print:bg-gray-100">
                      <TableHead className="print:text-sm">Producto</TableHead>
                      <TableHead className="text-right print:text-sm">Cantidad</TableHead>
                      <TableHead className="text-right print:text-sm">Precio Unit.</TableHead>
                      <TableHead className="text-right print:text-sm">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sale.saleItems.map((item: any) => (
                      <TableRow key={item.id} className="print:border-b print:border-gray-300">
                        <TableCell className="print:text-sm">
                          <div>
                            <div className="font-medium">{item.product.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right print:text-sm">{item.quantity}</TableCell>
                        <TableCell className="text-right print:text-sm">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium print:text-sm">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end print:border-t print:border-gray-300 print:pt-4">
              <div className="space-y-2 text-right print:w-1/2">
                <div className="text-3xl font-bold print:text-2xl">
                  Total: {formatCurrency(sale.total)}
                </div>
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="space-y-2 print:border print:border-gray-300 print:p-4 print:rounded">
                <h3 className="font-semibold text-lg print:text-base">Notas</h3>
                <p className="text-gray-600 print:text-sm">{sale.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4 text-sm text-gray-500 print:mt-8 print:border-t print:border-gray-300 print:pt-4">
              <p className="print:text-xs">Generado por Tecnicell - Sistema de Gestión</p>
              <p className="print:text-xs">Factura generada el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0.5cm;
            size: A4;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }
          
          .print\\:px-4 {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
          
          .print\\:py-2 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          
          .print\\:mt-8 {
            margin-top: 2rem !important;
          }
          
          /* Ocultar elementos de navegación del navegador no es posible desde CSS,
             pero podemos optimizar el contenido para impresión */
          
          .container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .space-y-6 > * + * {
            margin-top: 1rem !important;
          }
          
          /* Mejorar tabla para impresión */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          
          th, td {
            border: 1px solid #e5e7eb !important;
            padding: 0.5rem !important;
          }
          
          th {
            background-color: #f9fafb !important;
            font-weight: 600 !important;
          }
        }
      `}</style>
    </div>
  )
}
