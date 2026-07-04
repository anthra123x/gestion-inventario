export function calcSubtotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}

export function calcCost(items: { unitCost: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
}

export function calcTotal(laborCost: number, partsCost: number): number {
  return laborCost + partsCost
}

export function calcProfit(revenue: number, partsCost: number): number {
  return revenue - partsCost
}

export function calcMargin(revenue: number, partsCost: number): number {
  if (revenue === 0) return 0
  return ((revenue - partsCost) / revenue) * 100
}
