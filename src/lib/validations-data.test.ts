import { describe, it, expect } from 'vitest'
import {
  validateNonNegative,
  validatePositive,
  validatePriceMargin,
  validateProductData,
  validateSaleItemData,
  validateSalePriceAgainstCost,
  validateRepairPartData,
} from './validations-data'

describe('validateNonNegative', () => {
  it('passes for zero', () => {
    expect(() => validateNonNegative(0, 'Field')).not.toThrow()
  })

  it('passes for positive', () => {
    expect(() => validateNonNegative(10, 'Field')).not.toThrow()
  })

  it('throws for negative', () => {
    expect(() => validateNonNegative(-1, 'Stock')).toThrow('Stock no puede ser negativo')
  })
})

describe('validatePositive', () => {
  it('passes for positive', () => {
    expect(() => validatePositive(5, 'Field')).not.toThrow()
  })

  it('throws for zero', () => {
    expect(() => validatePositive(0, 'Cantidad')).toThrow('Cantidad debe ser mayor a 0')
  })

  it('throws for negative', () => {
    expect(() => validatePositive(-1, 'Field')).toThrow()
  })
})

describe('validatePriceMargin', () => {
  it('passes when sale price equals purchase price', () => {
    expect(() => validatePriceMargin(1000, 1000)).not.toThrow()
  })

  it('passes when sale price is higher', () => {
    expect(() => validatePriceMargin(1000, 2000)).not.toThrow()
  })

  it('throws when sale price is lower', () => {
    expect(() => validatePriceMargin(1000, 500)).toThrow(
      'El precio de venta no puede ser menor al precio de compra',
    )
  })
})

describe('validateProductData', () => {
  it('passes for valid product', () => {
    expect(() =>
      validateProductData({ stock: 10, purchasePrice: 5000, salePrice: 10000 }),
    ).not.toThrow()
  })

  it('throws for negative stock', () => {
    expect(() =>
      validateProductData({ stock: -1, purchasePrice: 5000, salePrice: 10000 }),
    ).toThrow('Stock no puede ser negativo')
  })

  it('throws for sale price below purchase price', () => {
    expect(() =>
      validateProductData({ stock: 10, purchasePrice: 10000, salePrice: 5000 }),
    ).toThrow('El precio de venta no puede ser menor al precio de compra')
  })
})

describe('validateSaleItemData', () => {
  it('passes for valid item', () => {
    expect(() =>
      validateSaleItemData({ quantity: 2, unitPrice: 1000, total: 2000 }),
    ).not.toThrow()
  })

  it('throws for zero quantity', () => {
    expect(() =>
      validateSaleItemData({ quantity: 0, unitPrice: 1000, total: 0 }),
    ).toThrow('Cantidad debe ser mayor a 0')
  })

  it('throws for negative unit price', () => {
    expect(() =>
      validateSaleItemData({ quantity: 1, unitPrice: -100, total: -100 }),
    ).toThrow('Precio unitario no puede ser negativo')
  })

  it('throws for negative total', () => {
    expect(() =>
      validateSaleItemData({ quantity: 1, unitPrice: 100, total: -100 }),
    ).toThrow('Total no puede ser negativo')
  })
})

describe('validateSalePriceAgainstCost', () => {
  it('returns ok when purchase price is 0', () => {
    const result = validateSalePriceAgainstCost(1000, 0)
    expect(result.ok).toBe(true)
  })

  it('returns error when selling below cost', () => {
    const result = validateSalePriceAgainstCost(500, 1000)
    expect(result.ok).toBe(false)
    expect(result.severity).toBe('error')
    expect(result.message).toContain('pérdida')
  })

  it('returns warning when margin is low but positive', () => {
    const result = validateSalePriceAgainstCost(1100, 1000)
    expect(result.ok).toBe(true)
    expect(result.severity).toBe('warning')
    expect(result.message).toContain('bajo')
  })

  it('returns ok for healthy margin', () => {
    const result = validateSalePriceAgainstCost(2000, 1000)
    expect(result.ok).toBe(true)
    expect(result.message).toBe('')
  })
})

describe('validateRepairPartData', () => {
  it('passes for valid part', () => {
    expect(() =>
      validateRepairPartData({ quantity: 1, unitCost: 15000, total: 15000 }),
    ).not.toThrow()
  })

  it('throws for zero quantity', () => {
    expect(() =>
      validateRepairPartData({ quantity: 0, unitCost: 15000, total: 0 }),
    ).toThrow('Cantidad debe ser mayor a 0')
  })

  it('throws for negative unit cost', () => {
    expect(() =>
      validateRepairPartData({ quantity: 1, unitCost: -100, total: -100 }),
    ).toThrow('Costo unitario no puede ser negativo')
  })
})
