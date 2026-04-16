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
export function validateProductData(data: {
  stock: number
  purchasePrice: number
  salePrice: number
}): void {
  validateNonNegative(data.stock, 'Stock')
  validateNonNegative(data.purchasePrice, 'Precio de compra')
  validateNonNegative(data.salePrice, 'Precio de venta')
  validatePriceMargin(data.purchasePrice, data.salePrice)
}

/**
 * Validates sale item data
 */
export function validateSaleItemData(data: {
  quantity: number
  unitPrice: number
  total: number
}): void {
  validatePositive(data.quantity, 'Cantidad')
  validateNonNegative(data.unitPrice, 'Precio unitario')
  validateNonNegative(data.total, 'Total')
}

/**
 * Validates repair part data
 */
export function validateRepairPartData(data: {
  quantity: number
  unitCost: number
  total: number
}): void {
  validatePositive(data.quantity, 'Cantidad')
  validateNonNegative(data.unitCost, 'Costo unitario')
  validateNonNegative(data.total, 'Total')
}

/**
 * Validates inventory movement data
 */
export function validateInventoryMovementData(data: {
  quantity: number
}): void {
  validatePositive(data.quantity, 'Cantidad')
}

/**
 * Validates system settings data
 */
export function validateSystemSettingsData(data: {
  defaultMinStock: number
  taxRate: number
}): void {
  validateNonNegative(data.defaultMinStock, 'Stock mínimo por defecto')
  validateNonNegative(data.taxRate, 'Tasa de impuesto')
}
