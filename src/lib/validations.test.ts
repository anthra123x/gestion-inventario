import { describe, it, expect } from 'vitest'
import {
  CreateProductSchema,
  CreateClientSchema,
  CreateRepairSchema,
  RepairStatusSchema,
} from './validations'

describe('CreateProductSchema', () => {
  it('validates a complete part', () => {
    const result = CreateProductSchema.safeParse({
      name: 'Cargador USB',
      description: 'Cargador tipo C',
      price: 15000,
    })
    expect(result.success).toBe(true)
  })

  it('rejects short name', () => {
    const result = CreateProductSchema.safeParse({ name: 'C' })
    expect(result.success).toBe(false)
  })

  it('rejects negative price', () => {
    const result = CreateProductSchema.safeParse({ name: 'Test', price: -1 })
    expect(result.success).toBe(false)
  })

  it('allows optional description', () => {
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

describe('CreateRepairSchema', () => {
  it('validates a complete repair', () => {
    const result = CreateRepairSchema.safeParse({
      clientId: 'c1',
      device: 'iPhone 12',
      problem: 'La pantalla no funciona después de una caída',
      laborCost: 50000,
      notes: 'Traer el lunes',
      internalNotes: 'Revisar flex',
      estimatedDate: '2026-06-01',
      parts: [{ partId: 'p1', quantity: 1, unitCost: 15000 }],
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

describe('RepairStatusSchema', () => {
  it('accepts valid statuses', () => {
    const valid = ['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']
    for (const s of valid) {
      expect(RepairStatusSchema.safeParse(s).success).toBe(true)
    }
  })
})
