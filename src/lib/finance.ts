export function calcSubtotal(items: { unitPrice: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
}

export function calcCost(items: { unitCost: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.unitCost * item.quantity, 0)
}
