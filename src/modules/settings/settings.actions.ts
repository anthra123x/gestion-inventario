'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin, requireAuth } from '@/modules/auth/auth.actions'
import { z } from 'zod'
import { tryCatch } from '@/lib/errors'
import { getString } from '@/lib/form-data'
import type { ActionResult } from '@/types'
import { success, failure } from '@/types'
import { getOrCreateSettings, updateSettings } from './settings.service'

const UpdateSettingsSchema = z.object({
  companyName: z.string().min(1, 'Nombre de empresa requerido'),
  companyAddress: z.string().optional().default(''),
  companyPhone: z.string().optional().default(''),
  companyEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  currency: z.enum(['COP', 'USD', 'EUR']).default('COP'),
  receiptFooter: z.string().optional().default(''),
})

export async function getSystemSettings() {
  await requireAuth()
  return tryCatch(() => getOrCreateSettings(), { context: 'getSystemSettings' })
}

export async function updateSystemSettings(formData: FormData): Promise<ActionResult> {
  await requireAdmin()

  const raw = {
    companyName: getString(formData, 'companyName') || '',
    companyAddress: getString(formData, 'companyAddress'),
    companyPhone: getString(formData, 'companyPhone'),
    companyEmail: getString(formData, 'companyEmail'),
    currency: getString(formData, 'currency') || 'COP',
    receiptFooter: getString(formData, 'receiptFooter'),
  }

  const parsed = UpdateSettingsSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return failure(firstError?.message || 'Datos de configuración inválidos')
  }

  const data = parsed.data
  const result = await tryCatch(
    () =>
      updateSettings({
        companyName: data.companyName,
        companyAddress: data.companyAddress || null,
        companyPhone: data.companyPhone || null,
        companyEmail: data.companyEmail || null,
        currency: data.currency,
        receiptFooter: data.receiptFooter || null,
      }),
    { context: 'updateSystemSettings' },
  )

  if (result.success) {
    revalidatePath('/admin')
    return success(undefined)
  }

  return result
}
