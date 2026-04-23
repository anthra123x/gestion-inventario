export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '$0'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue) || numValue === null) {
    return '$0'
  }

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numValue)
}

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '0'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue) || numValue === null) {
    return '0'
  }

  return new Intl.NumberFormat('es-CO').format(numValue)
}

export function normalizeBarcode(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}