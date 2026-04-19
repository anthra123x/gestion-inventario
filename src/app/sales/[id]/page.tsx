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

function formatCOP(value: number): string {
  return value.toLocaleString('es-CO')
}

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
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Invoice */}
        <Card className="print:shadow-none print:border print:border-gray-300">
          <CardHeader className="print:px-4 print:py-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">Factura #{sale.id.slice(-6).toUpperCase()}</CardTitle>
                <CardDescription>
                  Fecha: {new Date(sale.createdAt).toLocaleDateString('es-CO')} at {new Date(sale.createdAt).toLocaleTimeString('es-CO')}
                </CardDescription>
              </div>
              <Badge variant={getPaymentMethodColor(sale.paymentMethod) as any}>
                {getPaymentMethodLabel(sale.paymentMethod)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 print:px-4 print:py-2">
            {/* Client Info */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Datos del Cliente</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{clientData.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{clientData.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{clientData.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{clientData.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Productos</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Precio Unit.</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.saleItems.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          {item.product.barcode && (
                            <div className="text-sm text-gray-500">SKU: {item.product.barcode}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">${formatCOP(item.unitPrice)}</TableCell>
                      <TableCell className="text-right font-medium">${formatCOP(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Total */}
            <div className="flex justify-end">
              <div className="space-y-2 text-right">
                <div className="text-3xl font-bold">
                  Total: ${formatCOP(sale.total)} COP
                </div>
              </div>
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Notas</h3>
                <p className="text-gray-600">{sale.notes}</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t pt-4 text-sm text-gray-500 print:mt-8">
              <p>Generado por Tecnicell - Sistema de Gestión</p>
              <p>Factura generada el {new Date().toLocaleDateString('es-CO')} a las {new Date().toLocaleTimeString('es-CO')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
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
        }
      `}</style>
    </div>
  )
}
