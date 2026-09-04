'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/modules/auth/auth.actions'
import { z } from 'zod'
import { tryCatch } from '@/lib/errors'
import { getString } from '@/lib/form-data'
import type { ActionResult } from '@/types'
import { success, failure } from '@/types'
import { getOrCreateSettings, updateSettings } from './settings.service'

const UpdateSettingsSchema = z.object({
  companyName: z.string().min(1, 'Nombre de empresa requerido'),
  companyNit: z.string().optional().default(''),
  companyAddress: z.string().optional().default(''),
  companyCity: z.string().optional().default(''),
  companyPhone: z.string().optional().default(''),
  companyEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  currency: z.enum(['COP', 'USD', 'EUR']).default('COP'),
  invoicePrefix: z.string().min(1, 'Prefijo requerido').default('CIL-'),
  invoiceFooter: z.string().optional().default(''),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
})

export async function getSystemSettings() {
  await requireAuth()
  return tryCatch(() => getOrCreateSettings(), { context: 'getSystemSettings' })
}

export async function updateSystemSettings(formData: FormData): Promise<ActionResult> {
  await requireAuth()

  const raw = {
    companyName: getString(formData, 'companyName') || '',
    companyNit: getString(formData, 'companyNit'),
    companyAddress: getString(formData, 'companyAddress'),
    companyCity: getString(formData, 'companyCity'),
    companyPhone: getString(formData, 'companyPhone'),
    companyEmail: getString(formData, 'companyEmail'),
    currency: getString(formData, 'currency') || 'COP',
    invoicePrefix: getString(formData, 'invoicePrefix') || 'CIL-',
    invoiceFooter: getString(formData, 'invoiceFooter'),
    lowStockThreshold: Number(getString(formData, 'lowStockThreshold') || 5),
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
        companyNit: data.companyNit || null,
        companyAddress: data.companyAddress || null,
        companyCity: data.companyCity || null,
        companyPhone: data.companyPhone || null,
        companyEmail: data.companyEmail || null,
        currency: data.currency,
        invoicePrefix: data.invoicePrefix,
        invoiceFooter: data.invoiceFooter || null,
        lowStockThreshold: data.lowStockThreshold,
      }),
    { context: 'updateSystemSettings' },
  )

  if (result.success) {
    revalidatePath('/settings')
    revalidatePath('/admin')
    return success(undefined)
  }

  return result
}
