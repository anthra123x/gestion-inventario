'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Globe,
  Phone,
  Mail,
  MapPin,
  Package,
  FileText,
  Truck,
  LayoutDashboard,
  MessageCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { StatusBadge } from '@/components/ui/status-badge'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { getOrderById, updateOrderStatus, updateOrderNotes } from '@/modules/orders/orders.actions'
import { OrderStatus } from '@prisma/client'

const statusInfo: Record<
  OrderStatus,
  { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple' }
> = {
  PENDING: { label: 'Pendiente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'info' },
  PREPARING: { label: 'Preparando', variant: 'info' },
  SHIPPED: { label: 'Enviado', variant: 'purple' },
  DELIVERED: { label: 'Entregado', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'error' },
}

const statusFlow: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
}

const statusMessages: Record<OrderStatus, string> = {
  PENDING: 'recibimos tu pedido en Tecnicell. Te confirmaremos pronto.',
  CONFIRMED: 'tu pedido fue confirmado y estamos preparándolo.',
  PREPARING: 'tu pedido ya está siendo preparado.',
  SHIPPED: 'tu pedido ha sido enviado. Pronto lo recibirás.',
  DELIVERED: 'entregamos tu pedido. Gracias por tu compra.',
  CANCELLED: 'lamentamos informarte que tu pedido fue cancelado.',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getWhatsAppUrl(order: any): string {
  const cleanPhone = order.clientPhone.replace(/[^0-9]/g, '')
  const finalPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`
  const status = order.status as OrderStatus
  const message = `Hola ${order.clientName}, *${statusMessages[status]}*%0A%0APedido: #${order.id.slice(-6).toUpperCase()}%0ATotal: ${formatCurrency(order.total)}`
  return `https://wa.me/${finalPhone}?text=${message}`
}

export default function OrderDetailPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [changingStatus, setChangingStatus] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [internalNotes, setInternalNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    loadOrder()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function loadOrder() {
    try {
      const data = await getOrderById(id)
      if (!data) {
        toast.error('Pedido no encontrado')
        router.push('/orders')
        return
      }
      setOrder(data)
      setInternalNotes(data.internalNotes || '')
    } catch {
      toast.error('Error al cargar el pedido')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true)
    try {
      const result = await updateOrderNotes(id, internalNotes)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Notas guardadas')
      }
    } catch {
      toast.error('Error al guardar notas')
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    setChangingStatus(true)
    try {
      const result = await updateOrderStatus(id, newStatus)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Estado actualizado')
        loadOrder()
      }
    } catch {
      toast.error('Error al actualizar estado')
    } finally {
      setChangingStatus(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container py-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!order) return null

  const info = statusInfo[order.status as OrderStatus]
  const nextStatuses = statusFlow[order.status as OrderStatus]

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title={`Pedido #${order.id.slice(-6).toUpperCase()}`}
        description={`Recibido el ${new Date(order.createdAt).toLocaleDateString('es-CO')} a las ${new Date(order.createdAt).toLocaleTimeString('es-CO')}`}
        actions={
          <div className="flex gap-2">
            <Link href="/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Pedidos
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Status & Actions */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Estado del Pedido</CardTitle>
                <StatusBadge variant={info.variant} dot className="text-sm px-3 py-1">
                  {info.label}
                </StatusBadge>
              </div>
            </CardHeader>
            {nextStatuses.length > 0 && (
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((status) => {
                    const nextInfo = statusInfo[status]
                    if (status === 'CANCELLED') {
                      return (
                        <Dialog key={status} open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setCancelDialogOpen(true)}
                            disabled={changingStatus}
                          >
                            Cancelar Pedido
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Cancelar Pedido</DialogTitle>
                              <DialogDescription>
                                Esta acción devolverá {order.items?.length || 0} producto(s) al inventario.
                                {order.externalReference && (
                                  <span className="block mt-1">
                                    El pedido en la tienda online también será afectado.
                                  </span>
                                )}
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                                No, mantener pedido
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => {
                                  setCancelDialogOpen(false)
                                  handleStatusChange('CANCELLED')
                                }}
                              >
                                Sí, cancelar pedido
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )
                    }
                    return (
                      <Button
                        key={status}
                        variant="default"
                        size="sm"
                        onClick={() => handleStatusChange(status)}
                        disabled={changingStatus}
                      >
                        Marcar como {nextInfo.label}
                      </Button>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos ({order.items?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">{item.product?.name || 'Producto'}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.clientName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order.clientPhone}</span>
              </div>
              <a
                href={getWhatsAppUrl(order)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar WhatsApp
              </a>
              {order.clientEmail && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{order.clientEmail}</span>
                </div>
              )}
              {order.clientCity && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{order.clientCity}</span>
                </div>
              )}
              {order.clientAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{order.clientAddress}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío</span>
                <span>{formatCurrency(order.shipping)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <span>Total</span>
                <span className="text-emerald-600">{formatCurrency(order.total)}</span>
              </div>
            </CardContent>
          </Card>

          {order.externalReference && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Referencia Externa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <code className="text-sm bg-muted px-2 py-1 rounded">{order.externalReference}</code>
              </CardContent>
            </Card>
          )}

          {order.clientNotes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notas del Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.clientNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Internal Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notas Internas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Notas internas del pedido (solo visible en backoffice)"
                rows={3}
              />
              <Button variant="outline" size="sm" onClick={handleSaveNotes} disabled={savingNotes} className="w-full">
                {savingNotes ? 'Guardando...' : 'Guardar Notas'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
