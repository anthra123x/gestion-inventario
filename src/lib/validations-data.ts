// Data validation helpers for business logic

/**
 * Validates that a number is non-negative
 */
export function validateNonNegative(value: number, fieldName: string): void {
  if (value < 0) {
    throw new Error(`${fieldName} no puede ser negativo`)
  }
}

/**
 * Validates that a number is positive (> 0)
 */
export function validatePositive(value: number, fieldName: string): void {
  if (value <= 0) {
    throw new Error(`${fieldName} debe ser mayor a 0`)
  }
}

/**
 * Validates that sale price is >= purchase price
 */
export function validatePriceMargin(purchasePrice: number, salePrice: number): void {
  if (salePrice < purchasePrice) {
    throw new Error('El precio de venta no puede ser menor al precio de compra')
  }
}

/**
 * Validates product data
 */
export function validateProductData(data: { stock: number; purchasePrice: number; salePrice: number }): void {
  validateNonNegative(data.stock, 'Stock')
  validateNonNegative(data.purchasePrice, 'Precio de compra')
  validateNonNegative(data.salePrice, 'Precio de venta')
  validatePriceMargin(data.purchasePrice, data.salePrice)
}

/**
 * Validates sale item data
 */
export function validateSaleItemData(data: { quantity: number; unitPrice: number; total: number }): void {
  validatePositive(data.quantity, 'Cantidad')
  validateNonNegative(data.unitPrice, 'Precio unitario')
  validateNonNegative(data.total, 'Total')
}

export function validateSalePriceAgainstCost(
  unitPrice: number,
  purchasePrice: number,
): { ok: boolean; message: string; severity: 'error' | 'warning' } {
  if (purchasePrice <= 0) return { ok: true, message: '', severity: 'warning' }

  if (unitPrice < purchasePrice) {
    return {
      ok: false,
      message: `El precio de venta ($${unitPrice.toLocaleString('es-CO')}) es menor al costo ($${purchasePrice.toLocaleString('es-CO')}). Esto genera pérdida.`,
      severity: 'error',
    }
  }

  const margin = ((unitPrice - purchasePrice) / unitPrice) * 100
  if (margin < 15) {
    return {
      ok: true,
      message: `Margen bajo (${margin.toFixed(1)}%). El precio está muy cerca del costo.`,
      severity: 'warning',
    }
  }

  return { ok: true, message: '', severity: 'warning' }
}

/**
 * Validates repair part data
 */
export function validateRepairPartData(data: { quantity: number; unitCost: number; total: number }): void {
  validatePositive(data.quantity, 'Cantidad')
  validateNonNegative(data.unitCost, 'Costo unitario')
  validateNonNegative(data.total, 'Total')
}
