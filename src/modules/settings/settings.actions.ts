'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin, requireAuth } from '@/modules/auth/auth.actions'
import { z } from 'zod'

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
  try {
    return await getOrCreateSettings()
  } catch (error) {
    console.error('getSystemSettings error:', error)
    return null
  }
}

export async function updateSystemSettings(formData: FormData) {
  await requireAdmin()

  const raw = {
    companyName: formData.get('companyName'),
    companyAddress: formData.get('companyAddress'),
    companyPhone: formData.get('companyPhone'),
    companyEmail: formData.get('companyEmail'),
    defaultMinStock: formData.get('defaultMinStock'),
    lowStockAlert: formData.get('lowStockAlert'),
    currency: formData.get('currency'),
    taxRate: formData.get('taxRate'),
    receiptFooter: formData.get('receiptFooter'),
  }

  const parsed = UpdateSettingsSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError?.message || 'Datos de configuración inválidos' }
  }

  const data = parsed.data

  try {
    const settings = await getOrCreateSettings()
    const updated = await prisma.systemSettings.update({
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

    revalidatePath('/admin')
    return {
      success: 'Configuración actualizada exitosamente',
      settings: updated,
    }
  } catch (error) {
    console.error('updateSystemSettings error:', error)
    return { error: 'Error al actualizar configuración' }
  }
}
