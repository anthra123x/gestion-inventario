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

export function getCategoryTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INCOME: 'Ingreso',
    EXPENSE: 'Gasto',
    SAVING_GOAL: 'Meta de Ahorro',
  }
  return labels[type] || type
}

export function getTransactionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    INCOME: 'Ingreso',
    EXPENSE: 'Gasto',
  }
  return labels[type] || type
}

export function getTransactionTypeColor(type: string): string {
  const colors: Record<string, string> = {
    INCOME: 'text-green-600 bg-green-50 border-green-200',
    EXPENSE: 'text-red-600 bg-red-50 border-red-200',
  }
  return colors[type] || 'default'
}

export function getCategoryColor(color: string | null): string {
  const colors: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
  }
  return colors[color || ''] || 'bg-gray-500'
}

export function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    REPAIR_READY: 'Reparación lista',
    SYSTEM: 'Sistema',
    WEEK_CLOSED: 'Semana cerrada',
    SAVING_GOAL_REACHED: 'Meta de ahorro',
    LOW_STOCK: 'Stock bajo',
    BUDGET_ALERT: 'Alerta de presupuesto',
  }
  return labels[type] || type
}
