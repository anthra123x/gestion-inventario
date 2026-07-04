import { describe, it, expect } from 'vitest'
import { calcSubtotal, calcCost, calcTotal, calcProfit, calcMargin } from './finance'

describe('calcSubtotal', () => {
  it('calculates sum of unitPrice * quantity', () => {
    const items = [
      { unitPrice: 10000, quantity: 2 },
      { unitPrice: 5000, quantity: 3 },
    ]
    expect(calcSubtotal(items)).toBe(35000)
  })

  it('returns 0 for empty array', () => {
    expect(calcSubtotal([])).toBe(0)
  })
})

describe('calcCost', () => {
  it('calculates sum of unitCost * quantity', () => {
    const items = [
      { unitCost: 8000, quantity: 2 },
      { unitCost: 3000, quantity: 1 },
    ]
    expect(calcCost(items)).toBe(19000)
  })

  it('returns 0 for empty array', () => {
    expect(calcCost([])).toBe(0)
  })
})

describe('calcTotal', () => {
  it('sums labor and parts cost', () => {
    expect(calcTotal(50000, 30000)).toBe(80000)
  })

  it('handles zero values', () => {
    expect(calcTotal(0, 0)).toBe(0)
  })
})

describe('calcProfit', () => {
  it('subtracts parts cost from revenue', () => {
    expect(calcProfit(100000, 40000)).toBe(60000)
  })

  it('handles zero parts cost', () => {
    expect(calcProfit(50000, 0)).toBe(50000)
  })
})

describe('calcMargin', () => {
  it('calculates percentage margin', () => {
    expect(calcMargin(100000, 40000)).toBe(60)
  })

  it('returns 0 when revenue is 0', () => {
    expect(calcMargin(0, 0)).toBe(0)
  })

  it('returns negative margin when parts cost exceeds revenue', () => {
    expect(calcMargin(30000, 50000)).toBeCloseTo(-66.67, 1)
  })
})
