import { describe, it, expect } from 'vitest'
import { getZodErrorMessage } from './zod-error'

describe('getZodErrorMessage', () => {
  it('joins multiple issue messages', () => {
    const result = {
      success: false as const,
      error: {
        issues: [{ message: 'Campo requerido' }, { message: 'Debe ser positivo' }],
      },
    }
    expect(getZodErrorMessage(result)).toBe('Campo requerido, Debe ser positivo')
  })

  it('handles single issue', () => {
    const result = {
      success: false as const,
      error: {
        issues: [{ message: 'Email inválido' }],
      },
    }
    expect(getZodErrorMessage(result)).toBe('Email inválido')
  })

  it('returns default message when no error', () => {
    const result = { success: true as const }
    expect(getZodErrorMessage(result)).toBe('Datos inválidos')
  })

  it('returns default message when error is missing', () => {
    const result = { success: false as const }
    expect(getZodErrorMessage(result)).toBe('Datos inválidos')
  })
})
