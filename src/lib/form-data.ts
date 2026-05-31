import { z } from 'zod'

export function getNumber(formData: FormData, key: string): number | null {
  const value = formData.get(key)
  if (value === null || value === '') return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

export function getBoolean(formData: FormData, key: string): boolean {
  return formData.get(key) === 'true'
}

export function getString(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (value === null || value === '') return null
  return String(value)
}

export function getJSON<T = string[]>(formData: FormData, key: string): T {
  const value = formData.get(key)
  if (!value) return [] as unknown as T
  try {
    return JSON.parse(String(value)) as T
  } catch {
    return [] as unknown as T
  }
}

export function validateWithSchema<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data)
  if (result.success) return result
  const messages = result.error.issues.map((i) => i.message).join(', ')
  return { success: false, error: messages }
}
