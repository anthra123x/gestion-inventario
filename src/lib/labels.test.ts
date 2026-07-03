import { describe, it, expect } from 'vitest'
import { getRepairStatusLabel, getRepairStatusColor } from './labels'

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
