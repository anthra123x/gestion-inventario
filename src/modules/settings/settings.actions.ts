'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requireAuth } from '@/modules/auth/auth.actions'
import { z } from 'zod'
import { tryCatch } from '@/lib/errors'
import { getString, getNumber, getBoolean } from '@/lib/form-data'
import type { ActionResult } from '@/types'
import { success, failure } from '@/types'

const UpdateSettingsSchema = z.object({
  companyName: z.string().min(1, 'Nombre de empresa requerido'),
  companyAddress: z.string().optional().default(''),
  companyPhone: z.string().optional().default(''),
  companyEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  defaultMinStock: z.coerce.number().int().min(0).max(999999).default(5),
  lowStockAlert: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  currency: z.enum(['COP', 'USD', 'EUR']).default('COP'),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  receiptFooter: z.string().optional().default(''),
})

async function getOrCreateSettings() {
  const existing = await prisma.systemSettings.findFirst()
  if (existing) return existing
  return await prisma.systemSettings.create({ data: {} })
}

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
    defaultMinStock: getNumber(formData, 'defaultMinStock') ?? 5,
    lowStockAlert: getBoolean(formData, 'lowStockAlert'),
    currency: getString(formData, 'currency') || 'COP',
    taxRate: getNumber(formData, 'taxRate') ?? 0,
    receiptFooter: getString(formData, 'receiptFooter'),
  }

  const parsed = UpdateSettingsSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return failure(firstError?.message || 'Datos de configuración inválidos')
  }

  const result = await tryCatch(async () => {
    const settings = await getOrCreateSettings()
    const data = parsed.data
    await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        companyName: data.companyName,
        companyAddress: data.companyAddress || null,
        companyPhone: data.companyPhone || null,
        companyEmail: data.companyEmail || null,
        defaultMinStock: data.defaultMinStock,
        lowStockAlert: data.lowStockAlert,
        currency: data.currency,
        taxRate: data.taxRate,
        receiptFooter: data.receiptFooter || null,
      },
    })
  }, { context: 'updateSystemSettings' })

  if (result.success) {
    revalidatePath('/admin')
    return success(undefined)
  }

  return result
}
