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
    SYSTEM: 'Sistema',
    LOW_STOCK: 'Stock bajo',
  }
  return labels[type] || type
}
