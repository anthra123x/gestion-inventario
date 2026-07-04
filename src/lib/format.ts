const CURRENCY_LOCALE: Record<string, string> = {
  COP: 'es-CO',
  USD: 'en-US',
  EUR: 'es-ES',
}

export function formatCurrency(value: number | string | null | undefined, currency = 'COP'): string {
  if (value === null || value === undefined) {
    return '$0'
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(numValue)) {
    return '$0'
  }

  const locale = CURRENCY_LOCALE[currency] || 'es-CO'

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
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
