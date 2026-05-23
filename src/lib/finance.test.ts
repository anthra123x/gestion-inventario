import { describe, it, expect } from 'vitest'
import {
  calcSubtotal,
  calcDiscountAmount,
  calcTotal,
  calcCost,
  calcProfit,
  calcMargin,
  getProfitStatus,
  getItemProfit,
  getItemMargin,
} from './finance'

describe('calcSubtotal', () => {
  it('calculates sum of unitPrice * quantity', () => {
    const items = [
      { unitPrice: 1000, quantity: 2 },
      { unitPrice: 500, quantity: 3 },
    ]
    expect(calcSubtotal(items)).toBe(3500)
  })

  it('returns 0 for empty array', () => {
    expect(calcSubtotal([])).toBe(0)
  })

  it('handles single item', () => {
    expect(calcSubtotal([{ unitPrice: 1000, quantity: 1 }])).toBe(1000)
  })
})

describe('calcDiscountAmount', () => {
  it('calculates percentage discount', () => {
    expect(calcDiscountAmount(1000, 10)).toBe(100)
  })

  it('returns 0 for 0% discount', () => {
    expect(calcDiscountAmount(1000, 0)).toBe(0)
  })

  it('returns 0 for negative discount', () => {
    expect(calcDiscountAmount(1000, -5)).toBe(0)
  })

  it('returns 0 for discount over 100%', () => {
    expect(calcDiscountAmount(1000, 150)).toBe(0)
  })

  it('handles 100% discount', () => {
    expect(calcDiscountAmount(1000, 100)).toBe(1000)
  })

  it('handles fractional discount', () => {
    expect(calcDiscountAmount(1000, 12.5)).toBe(125)
  })
})

describe('calcTotal', () => {
  it('subtracts discount from subtotal', () => {
    expect(calcTotal(1000, 10)).toBe(900)
  })

  it('returns subtotal when no discount', () => {
    expect(calcTotal(1000, 0)).toBe(1000)
  })
})

describe('calcCost', () => {
  it('calculates sum of unitCost * quantity', () => {
    const items = [
      { unitCost: 800, quantity: 2 },
      { unitCost: 300, quantity: 3 },
    ]
    expect(calcCost(items)).toBe(2500)
  })

  it('returns 0 for empty array', () => {
    expect(calcCost([])).toBe(0)
  })
})

describe('calcProfit', () => {
  it('calculates total minus cost', () => {
    expect(calcProfit(1000, 700, 0)).toBe(300)
  })

  it('accounts for discount', () => {
    expect(calcProfit(1000, 700, 10)).toBe(200)
  })

  it('returns negative for loss', () => {
    expect(calcProfit(1000, 1200, 0)).toBe(-200)
  })
})

describe('calcMargin', () => {
  it('calculates margin percentage', () => {
    expect(calcMargin(1000, 700, 0)).toBeCloseTo(30, 0)
  })

  it('accounts for discount in margin', () => {
    expect(calcMargin(1000, 700, 10)).toBeCloseTo(22.22, 1)
  })

  it('returns 0 when total is 0', () => {
    expect(calcMargin(0, 0, 0)).toBe(0)
  })

  it('returns negative margin for loss', () => {
    expect(calcMargin(1000, 1500, 0)).toBe(-50)
  })
})

describe('getProfitStatus', () => {
  it('returns loss status for negative profit', () => {
    const result = getProfitStatus(-20, -100)
    expect(result.status).toBe('loss')
    expect(result.marginLabel).toBe('Pérdida')
  })

  it('returns warning for margin under 15%', () => {
    const result = getProfitStatus(10, 50)
    expect(result.status).toBe('warning')
    expect(result.marginLabel).toBe('Margen bajo')
  })

  it('returns profit for healthy margin', () => {
    const result = getProfitStatus(30, 300)
    expect(result.status).toBe('profit')
    expect(result.marginLabel).toBe('Ganancia')
  })

  it('includes margin and profitAmount in result', () => {
    const result = getProfitStatus(25, 250)
    expect(result.margin).toBe(25)
    expect(result.profitAmount).toBe(250)
  })
})

describe('getItemProfit', () => {
  it('calculates per-item profit', () => {
    expect(getItemProfit(1000, 700, 2)).toBe(600)
  })

  it('returns negative when selling below cost', () => {
    expect(getItemProfit(500, 700, 1)).toBe(-200)
  })

  it('handles zero quantity', () => {
    expect(getItemProfit(1000, 700, 0)).toBe(0)
  })
})

describe('getItemMargin', () => {
  it('calculates per-item margin percentage', () => {
    expect(getItemMargin(1000, 700)).toBeCloseTo(30, 0)
  })

  it('returns 0 when unitPrice is 0', () => {
    expect(getItemMargin(0, 100)).toBe(0)
  })

  it('returns negative margin for loss', () => {
    expect(getItemMargin(500, 1000)).toBe(-100)
  })
})
