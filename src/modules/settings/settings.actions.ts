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
  receiptTitle: z.string().min(1, 'Título del recibo requerido').default('FICHA TÉCNICA'),
  receiptTagline: z.string().optional().default('Centro de Servicio Técnico'),
  receiptFooter: z.string().optional().default(''),
  warrantyText: z.string().min(1, 'Texto de garantía requerido'),
  invoicePrefix: z.string().min(1, 'Prefijo requerido').default('REP-'),
  defaultWarrantyDays: z.coerce.number().int().min(0).default(30),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
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
    receiptTitle: getString(formData, 'receiptTitle') || 'FICHA TÉCNICA',
    receiptTagline: getString(formData, 'receiptTagline') || '',
    receiptFooter: getString(formData, 'receiptFooter'),
    warrantyText: getString(formData, 'warrantyText') || '',
    invoicePrefix: getString(formData, 'invoicePrefix') || 'REP-',
    defaultWarrantyDays: Number(getString(formData, 'defaultWarrantyDays') || 30),
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
        companyAddress: data.companyAddress || null,
        companyPhone: data.companyPhone || null,
        companyEmail: data.companyEmail || null,
        currency: data.currency,
        receiptTitle: data.receiptTitle,
        receiptTagline: data.receiptTagline || null,
        receiptFooter: data.receiptFooter || null,
        warrantyText: data.warrantyText,
        invoicePrefix: data.invoicePrefix,
        defaultWarrantyDays: data.defaultWarrantyDays,
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
