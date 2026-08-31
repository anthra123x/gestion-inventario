import { describe, it, expect } from 'vitest'
import {
  CreateProductSchema,
  CreateClientSchema,
  CreateProductCategorySchema,
  CreateSupplierSchema,
  CreateSaleSchema,
  PaymentMethodSchema,
  SaleStatusSchema,
  StockMovementTypeSchema,
} from './validations'

describe('CreateProductSchema', () => {
  it('validates a complete product', () => {
    const result = CreateProductSchema.safeParse({
      name: 'Tenis Deportivo',
      description: 'Tenis talla 40',
      barcode: '123456789',
      costPrice: 50000,
      salePrice: 80000,
      stock: 10,
      lowStockThreshold: 5,
      categoryId: 'c1',
      supplierId: 's1',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short name', () => {
    const result = CreateProductSchema.safeParse({ name: 'C' })
    expect(result.success).toBe(false)
  })

  it('rejects negative sale price', () => {
    const result = CreateProductSchema.safeParse({ name: 'Test', salePrice: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects negative stock', () => {
    const result = CreateProductSchema.safeParse({ name: 'Test', stock: -5 })
    expect(result.success).toBe(false)
  })

  it('allows defaults when only name is provided', () => {
    const result = CreateProductSchema.safeParse({ name: 'Test' })
    expect(result.success).toBe(true)
  })
})

describe('CreateClientSchema', () => {
  it('validates a complete client', () => {
    const result = CreateClientSchema.safeParse({
      name: 'Juan Pérez',
      phone: '3001234567',
      email: 'juan@email.com',
      address: 'Calle 123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects short name', () => {
    const result = CreateClientSchema.safeParse({
      name: 'J',
      phone: '3001234567',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short phone', () => {
    const result = CreateClientSchema.safeParse({
      name: 'Juan',
      phone: '1234',
    })
    expect(result.success).toBe(false)
  })

  it('allows optional email and address', () => {
    const result = CreateClientSchema.safeParse({
      name: 'Juan',
      phone: '3001234567',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = CreateClientSchema.safeParse({
      name: 'Juan',
      phone: '3001234567',
      email: 'not-an-email',
    })
    expect(result.success).toBe(false)
  })
})

describe('CreateProductCategorySchema', () => {
  it('validates a category with name only', () => {
    const result = CreateProductCategorySchema.safeParse({ name: 'Ropa' })
    expect(result.success).toBe(true)
  })

  it('validates a category with color', () => {
    const result = CreateProductCategorySchema.safeParse({ name: 'Ropa', color: '#ff0000' })
    expect(result.success).toBe(true)
  })

  it('rejects short name', () => {
    const result = CreateProductCategorySchema.safeParse({ name: 'R' })
    expect(result.success).toBe(false)
  })
})

describe('CreateSupplierSchema', () => {
  it('validates a supplier', () => {
    const result = CreateSupplierSchema.safeParse({
      name: 'Distribuidora XYZ',
      phone: '3001234567',
      email: 'contacto@xyz.com',
      address: 'Av 1',
    })
    expect(result.success).toBe(true)
  })

  it('allows only name', () => {
    const result = CreateSupplierSchema.safeParse({ name: 'Distribuidora XYZ' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = CreateSupplierSchema.safeParse({ name: 'Xyz', email: 'bad' })
    expect(result.success).toBe(false)
  })
})

describe('CreateSaleSchema', () => {
  it('validates a sale with items', () => {
    const result = CreateSaleSchema.safeParse({
      paymentMethod: 'CASH',
      items: [{ productId: 'p1', quantity: 2 }],
      discount: 0,
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty items', () => {
    const result = CreateSaleSchema.safeParse({
      paymentMethod: 'CASH',
      items: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative discount', () => {
    const result = CreateSaleSchema.safeParse({
      paymentMethod: 'CASH',
      items: [{ productId: 'p1', quantity: 1 }],
      discount: -5,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid payment method', () => {
    const result = CreateSaleSchema.safeParse({
      paymentMethod: 'BITCOIN',
      items: [{ productId: 'p1', quantity: 1 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('PaymentMethodSchema', () => {
  it('accepts valid methods', () => {
    const valid = ['CASH', 'CARD', 'TRANSFER']
    for (const m of valid) {
      expect(PaymentMethodSchema.safeParse(m).success).toBe(true)
    }
  })
})

describe('SaleStatusSchema', () => {
  it('accepts valid statuses', () => {
    const valid = ['COMPLETED', 'CANCELLED']
    for (const s of valid) {
      expect(SaleStatusSchema.safeParse(s).success).toBe(true)
    }
  })
})

describe('StockMovementTypeSchema', () => {
  it('accepts valid movement types', () => {
    const valid = ['PURCHASE', 'SALE', 'IN', 'OUT', 'ADJUST']
    for (const t of valid) {
      expect(StockMovementTypeSchema.safeParse(t).success).toBe(true)
    }
  })
})
