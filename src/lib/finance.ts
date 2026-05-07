export interface ProfitResult {
  status: 'profit' | 'warning' | 'loss'
  margin: number
  profitAmount: number
  marginLabel: string
}

export function calcSubtotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}

export function calcDiscountAmount(subtotal: number, discountPercent: number): number {
  if (discountPercent <= 0 || discountPercent > 100) return 0
  return subtotal * (discountPercent / 100)
}

export function calcTotal(subtotal: number, discountPercent: number): number {
  const discount = calcDiscountAmount(subtotal, discountPercent)
  return subtotal - discount
}

export function calcCost(items: { unitCost: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
}

export function calcProfit(subtotal: number, cost: number, discountPercent: number): number {
  const total = calcTotal(subtotal, discountPercent)
  return total - cost
}

export function calcMargin(subtotal: number, cost: number, discountPercent: number): number {
  const total = calcTotal(subtotal, discountPercent)
  if (total <= 0) return 0
  return ((total - cost) / total) * 100
}

export function getProfitStatus(margin: number, profitAmount: number): ProfitResult {
  let status: 'profit' | 'warning' | 'loss'
  let marginLabel: string

  if (profitAmount < 0 || margin < 0) {
    status = 'loss'
    marginLabel = 'Pérdida'
  } else if (margin < 15) {
    status = 'warning'
    marginLabel = 'Margen bajo'
  } else {
    status = 'profit'
    marginLabel = 'Ganancia'
  }

  return { status, margin, profitAmount, marginLabel }
}

export function getItemProfit(unitPrice: number, unitCost: number, quantity: number): number {
  return (unitPrice - unitCost) * quantity
}

export function getItemMargin(unitPrice: number, unitCost: number): number {
  if (unitPrice <= 0) return 0
  return ((unitPrice - unitCost) / unitPrice) * 100
}
