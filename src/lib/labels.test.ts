import { describe, it, expect } from 'vitest'
import {
  getPaymentMethodLabel,
  getPaymentMethodColor,
  getRepairStatusLabel,
  getRepairStatusColor,
  getStockStatus,
  getCategoryLabel,
  getOrderStatusLabel,
  getOrderStatusColor,
} from './labels'

describe('getPaymentMethodLabel', () => {
  it('returns label for CASH', () => {
    expect(getPaymentMethodLabel('CASH')).toBe('Efectivo')
  })

  it('returns label for CARD', () => {
    expect(getPaymentMethodLabel('CARD')).toBe('Tarjeta')
  })

  it('returns label for TRANSFER', () => {
    expect(getPaymentMethodLabel('TRANSFER')).toBe('Transferencia')
  })

  it('returns input for unknown method', () => {
    expect(getPaymentMethodLabel('CRYPTO')).toBe('CRYPTO')
  })
})

describe('getPaymentMethodColor', () => {
  it('returns default for CASH', () => {
    expect(getPaymentMethodColor('CASH')).toBe('default')
  })

  it('returns secondary for CARD', () => {
    expect(getPaymentMethodColor('CARD')).toBe('secondary')
  })

  it('returns outline for TRANSFER', () => {
    expect(getPaymentMethodColor('TRANSFER')).toBe('outline')
  })

  it('returns default for unknown', () => {
    expect(getPaymentMethodColor('CRYPTO')).toBe('default')
  })
})

describe('getRepairStatusLabel', () => {
  it('returns label for all statuses', () => {
    expect(getRepairStatusLabel('RECEIVED')).toBe('Recibido')
    expect(getRepairStatusLabel('IN_PROGRESS')).toBe('En Progreso')
    expect(getRepairStatusLabel('READY')).toBe('Listo')
    expect(getRepairStatusLabel('DELIVERED')).toBe('Entregado')
    expect(getRepairStatusLabel('CANCELLED')).toBe('Cancelado')
  })

  it('returns input for unknown', () => {
    expect(getRepairStatusLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})

describe('getRepairStatusColor', () => {
  it('returns a non-empty string for all statuses', () => {
    const statuses = ['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED']
    for (const s of statuses) {
      expect(getRepairStatusColor(s)).toBeTruthy()
    }
  })
})

describe('getStockStatus', () => {
  it('returns agotado for zero stock', () => {
    expect(getStockStatus(0, 5)).toEqual({ label: 'Agotado', variant: 'destructive' })
  })

  it('returns stock bajo when at or below minStock', () => {
    expect(getStockStatus(3, 5)).toEqual({ label: 'Stock Bajo', variant: 'warning' })
    expect(getStockStatus(5, 5)).toEqual({ label: 'Stock Bajo', variant: 'warning' })
  })

  it('returns en stock when above minStock', () => {
    expect(getStockStatus(10, 5)).toEqual({ label: 'En Stock', variant: 'default' })
  })
})

describe('getCategoryLabel', () => {
  it('returns labels for all categories', () => {
    expect(getCategoryLabel('ACCESSORY')).toBe('Accesorio')
    expect(getCategoryLabel('REPAIR_PART')).toBe('Repuesto')
    expect(getCategoryLabel('DEVICE')).toBe('Dispositivo')
    expect(getCategoryLabel('OTHER')).toBe('Otro')
  })
})

describe('getOrderStatusLabel', () => {
  it('returns labels for all statuses', () => {
    expect(getOrderStatusLabel('PENDING')).toBe('Pendiente')
    expect(getOrderStatusLabel('CONFIRMED')).toBe('Confirmado')
    expect(getOrderStatusLabel('PREPARING')).toBe('Preparando')
    expect(getOrderStatusLabel('SHIPPED')).toBe('Enviado')
    expect(getOrderStatusLabel('DELIVERED')).toBe('Entregado')
    expect(getOrderStatusLabel('CANCELLED')).toBe('Cancelado')
  })
})

describe('getOrderStatusColor', () => {
  it('returns a color string for all statuses', () => {
    const statuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    for (const s of statuses) {
      expect(getOrderStatusColor(s)).toBeTruthy()
    }
  })
})
