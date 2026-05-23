import { ProductCategory } from '@prisma/client'

export function getPaymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
  }
  return labels[method] || method
}

export function getPaymentMethodColor(method: string): string {
  const colors: Record<string, string> = {
    CASH: 'default',
    CARD: 'secondary',
    TRANSFER: 'outline',
  }
  return colors[method] || 'default'
}

export function getRepairStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    RECEIVED: 'Recibido',
    IN_PROGRESS: 'En Progreso',
    READY: 'Listo',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }
  return labels[status] || status
}

export function getRepairStatusColor(status: string): string {
  const colors: Record<string, string> = {
    RECEIVED: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    READY: 'bg-green-100 text-green-800 border-green-200',
    DELIVERED: 'bg-purple-100 text-purple-800 border-purple-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status] || 'default'
}

export function getStockStatus(
  stock: number,
  minStock: number,
): { label: string; variant: 'default' | 'destructive' | 'warning' } {
  if (stock === 0) return { label: 'Agotado', variant: 'destructive' }
  if (stock <= minStock) return { label: 'Stock Bajo', variant: 'warning' }
  return { label: 'En Stock', variant: 'default' }
}

export function getCategoryLabel(category: ProductCategory): string {
  const labels: Record<ProductCategory, string> = {
    ACCESSORY: 'Accesorio',
    REPAIR_PART: 'Repuesto',
    DEVICE: 'Dispositivo',
    OTHER: 'Otro',
  }
  return labels[category]
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Preparando',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }
  return labels[status] || status
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-200',
    PREPARING: 'bg-orange-100 text-orange-800 border-orange-200',
    SHIPPED: 'bg-purple-100 text-purple-800 border-purple-200',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status] || 'default'
}
