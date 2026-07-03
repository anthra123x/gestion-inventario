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
