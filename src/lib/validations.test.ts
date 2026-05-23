import { describe, it, expect } from 'vitest'
import {
  CreateSaleSchema,
  CreateProductSchema,
  CreateClientSchema,
  CreateRepairSchema,
  CreateOrderSchema,
  PaymentMethodSchema,
  RepairStatusSchema,
  OrderStatusSchema,
} from './validations'

describe('CreateSaleSchema', () => {
  it('validates a complete sale', () => {
    const result = CreateSaleSchema.safeParse({
      clientName: 'Juan Pérez',
      clientPhone: '3001234567',
      items: [{ productId: 'p1', quantity: 2, unitPrice: 1000 }],
      discountPercent: 10,
      paymentMethod: 'CASH',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty items', () => {
    const result = CreateSaleSchema.safeParse({
      items: [],
      paymentMethod: 'CASH',
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative unit price', () => {
    const result = CreateSaleSchema.safeParse({
      items: [{ productId: 'p1', quantity: 1, unitPrice: -100 }],
      paymentMethod: 'CASH',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid payment method', () => {
    const result = CreateSaleSchema.safeParse({
      items: [{ productId: 'p1', quantity: 1, unitPrice: 1000 }],
      paymentMethod: 'BITCOIN',
    })
    expect(result.success).toBe(false)
  })

  it('allows optional client fields', () => {
    const result = CreateSaleSchema.safeParse({
      items: [{ productId: 'p1', quantity: 1, unitPrice: 1000 }],
      paymentMethod: 'CARD',
    })
    expect(result.success).toBe(true)
  })

  it('allows null clientId', () => {
    const result = CreateSaleSchema.safeParse({
      clientId: null,
      items: [{ productId: 'p1', quantity: 1, unitPrice: 1000 }],
      paymentMethod: 'CASH',
    })
    expect(result.success).toBe(true)
  })

  it('validates client email format', () => {
    const result = CreateSaleSchema.safeParse({
      clientEmail: 'invalid-email',
      items: [{ productId: 'p1', quantity: 1, unitPrice: 1000 }],
      paymentMethod: 'CASH',
    })
    expect(result.success).toBe(false)
  })

  it('defaults discountPercent to 0', () => {
    const result = CreateSaleSchema.safeParse({
      items: [{ productId: 'p1', quantity: 1, unitPrice: 1000 }],
      paymentMethod: 'CASH',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.discountPercent).toBe(0)
    }
  })

  it('rejects discount over 100%', () => {
    const result = CreateSaleSchema.safeParse({
      items: [{ productId: 'p1', quantity: 1, unitPrice: 1000 }],
      discountPercent: 150,
      paymentMethod: 'CASH',
    })
    expect(result.success).toBe(false)
  })

  it('validates all payment methods', () => {
    const valid = ['CASH', 'CARD', 'TRANSFER'] as const
    for (const method of valid) {
      const result = CreateSaleSchema.safeParse({
        items: [{ productId: 'p1', quantity: 1, unitPrice: 1000 }],
        paymentMethod: method,
      })
      expect(result.success).toBe(true)
    }
  })
})

describe('CreateProductSchema', () => {
  it('validates a complete product', () => {
    const result = CreateProductSchema.safeParse({
      name: 'Cargador USB',
      category: 'ACCESSORY',
      stock: 10,
      minStock: 5,
      purchasePrice: 5000,
      salePrice: 10000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects short name', () => {
    const result = CreateProductSchema.safeParse({
      name: 'C',
      category: 'ACCESSORY',
      stock: 10,
      minStock: 5,
      purchasePrice: 5000,
      salePrice: 10000,
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative stock', () => {
    const result = CreateProductSchema.safeParse({
      name: 'Test',
      category: 'ACCESSORY',
      stock: -1,
      minStock: 5,
      purchasePrice: 5000,
      salePrice: 10000,
    })
    expect(result.success).toBe(false)
  })

  it('allows optional description and supplier', () => {
    const result = CreateProductSchema.safeParse({
      name: 'Test',
      category: 'ACCESSORY',
      stock: 10,
      minStock: 5,
      purchasePrice: 5000,
      salePrice: 10000,
      description: 'A product',
      supplier: 'Supplier X',
    })
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

describe('CreateRepairSchema', () => {
  it('validates a complete repair', () => {
    const result = CreateRepairSchema.safeParse({
      clientId: 'c1',
      device: 'iPhone 12',
      problem: 'La pantalla no funciona después de una caída',
      cost: 50000,
      notes: 'Traer el lunes',
      internalNotes: 'Revisar flex',
      estimatedDate: '2026-06-01',
      parts: [{ productId: 'p1', quantity: 1, unitCost: 15000 }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects short device name', () => {
    const result = CreateRepairSchema.safeParse({
      clientId: 'c1',
      device: 'X',
      problem: 'Descripción suficientemente larga del problema',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short problem description', () => {
    const result = CreateRepairSchema.safeParse({
      clientId: 'c1',
      device: 'iPhone',
      problem: 'Cor',
    })
    expect(result.success).toBe(false)
  })

  it('allows optional fields', () => {
    const result = CreateRepairSchema.safeParse({
      clientId: 'c1',
      device: 'iPhone',
      problem: 'Descripción suficientemente larga del problema',
    })
    expect(result.success).toBe(true)
  })

  it('allows empty parts', () => {
    const result = CreateRepairSchema.safeParse({
      clientId: 'c1',
      device: 'iPhone',
      problem: 'Descripción suficientemente larga del problema',
      parts: [],
    })
    expect(result.success).toBe(true)
  })
})

describe('CreateOrderSchema', () => {
  it('validates a complete order', () => {
    const result = CreateOrderSchema.safeParse({
      clientName: 'Juan Pérez',
      clientPhone: '3001234567',
      subtotal: 50000,
      shipping: 5000,
      total: 55000,
      items: [{ productId: 'p1', quantity: 1, unitPrice: 50000 }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects short phone', () => {
    const result = CreateOrderSchema.safeParse({
      clientName: 'Juan',
      clientPhone: '123',
      total: 10000,
      items: [{ productId: 'p1', quantity: 1, unitPrice: 10000 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty items', () => {
    const result = CreateOrderSchema.safeParse({
      clientName: 'Juan',
      clientPhone: '3001234567',
      total: 0,
      items: [],
    })
    expect(result.success).toBe(false)
  })

  it('allows optional fields', () => {
    const result = CreateOrderSchema.safeParse({
      clientName: 'Juan',
      clientPhone: '3001234567',
      total: 10000,
      items: [{ productId: 'p1', quantity: 1, unitPrice: 10000 }],
    })
    expect(result.success).toBe(true)
  })
})

describe('Enums', () => {
  it('PaymentMethodSchema accepts valid values', () => {
    expect(PaymentMethodSchema.safeParse('CASH').success).toBe(true)
    expect(PaymentMethodSchema.safeParse('CARD').success).toBe(true)
    expect(PaymentMethodSchema.safeParse('TRANSFER').success).toBe(true)
  })

  it('PaymentMethodSchema rejects invalid values', () => {
    expect(PaymentMethodSchema.safeParse('CRYPTO').success).toBe(false)
  })

  it('RepairStatusSchema accepts valid statuses', () => {
    const valid = ['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']
    for (const s of valid) {
      expect(RepairStatusSchema.safeParse(s).success).toBe(true)
    }
  })

  it('OrderStatusSchema accepts valid statuses', () => {
    const valid = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    for (const s of valid) {
      expect(OrderStatusSchema.safeParse(s).success).toBe(true)
    }
  })
})
