import { describe, it, expect } from 'vitest'
import {
  getCategoryTypeLabel,
  getTransactionTypeLabel,
  getTransactionTypeColor,
  getCategoryColor,
  getNotificationTypeLabel,
} from './labels'

describe('getCategoryTypeLabel', () => {
  it('returns correct label for known types', () => {
    expect(getCategoryTypeLabel('INCOME')).toBe('Ingreso')
    expect(getCategoryTypeLabel('EXPENSE')).toBe('Gasto')
    expect(getCategoryTypeLabel('SAVING_GOAL')).toBe('Meta de Ahorro')
  })

  it('returns the input type for unknown values', () => {
    expect(getCategoryTypeLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})

describe('getTransactionTypeLabel', () => {
  it('returns correct label for known types', () => {
    expect(getTransactionTypeLabel('INCOME')).toBe('Ingreso')
    expect(getTransactionTypeLabel('EXPENSE')).toBe('Gasto')
  })

  it('returns the input type for unknown values', () => {
    expect(getTransactionTypeLabel('UNKNOWN')).toBe('UNKNOWN')
  })
})

describe('getTransactionTypeColor', () => {
  it('returns ok for known types', () => {
    expect(getTransactionTypeColor('INCOME')).toContain('text-green-600')
    expect(getTransactionTypeColor('EXPENSE')).toContain('text-red-600')
  })

  it('returns default for unknown values', () => {
    expect(getTransactionTypeColor('UNKNOWN')).toBe('default')
  })
})

describe('getCategoryColor', () => {
  it('returns the mapped class for known colors', () => {
    expect(getCategoryColor('blue')).toBe('bg-blue-500')
    expect(getCategoryColor('red')).toBe('bg-red-500')
    expect(getCategoryColor('teal')).toBe('bg-teal-500')
  })

  it('returns gray fallback for null or unknown', () => {
    expect(getCategoryColor(null)).toBe('bg-gray-500')
    expect(getCategoryColor('neon')).toBe('bg-gray-500')
  })
})

describe('getNotificationTypeLabel', () => {
  it('returns correct label for known types', () => {
    expect(getNotificationTypeLabel('SYSTEM')).toBe('Sistema')
    expect(getNotificationTypeLabel('LOW_STOCK')).toBe('Stock bajo')
  })

  it('returns the input type for unknown values', () => {
    expect(getNotificationTypeLabel('OLD_TYPE')).toBe('OLD_TYPE')
  })
})
