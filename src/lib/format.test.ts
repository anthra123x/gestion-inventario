import { describe, it, expect } from 'vitest'
import { formatCurrency, formatNumber } from './format'

describe('formatCurrency', () => {
  it('formats a number as COP', () => {
    const result = formatCurrency(1500000)
    expect(result).toContain('$')
    expect(result).toContain('1')
    expect(result).toContain('500')
  })

  it('returns $0 for null', () => {
    expect(formatCurrency(null)).toBe('$0')
  })

  it('returns $0 for undefined', () => {
    expect(formatCurrency(undefined)).toBe('$0')
  })

  it('parses string numbers', () => {
    const result = formatCurrency('50000')
    expect(result).toContain('50')
  })

  it('returns $0 for NaN string', () => {
    expect(formatCurrency('not-a-number')).toBe('$0')
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('$')
    expect(result).toContain('0')
  })

  it('formats large numbers with thousands separator', () => {
    const result = formatCurrency(1000000)
    expect(result).toContain('$')
    expect(result).toContain('1')
  })

  it('formats negative numbers', () => {
    const result = formatCurrency(-5000)
    expect(result).toContain('-')
    expect(result).toContain('$')
  })
})

describe('formatNumber', () => {
  it('formats a number with locale separators', () => {
    const result = formatNumber(1500)
    expect(result).toBe('1.500')
  })

  it('returns 0 for null', () => {
    expect(formatNumber(null)).toBe('0')
  })

  it('returns 0 for undefined', () => {
    expect(formatNumber(undefined)).toBe('0')
  })

  it('parses string numbers', () => {
    expect(formatNumber('50000')).toBe('50.000')
  })

  it('returns 0 for NaN string', () => {
    expect(formatNumber('not-a-number')).toBe('0')
  })

  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0')
  })

  it('formats large numbers', () => {
    expect(formatNumber(1000000)).toBe('1.000.000')
  })
})
