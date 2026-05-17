'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/modules/auth/auth.actions'

async function getOrCreateSettings() {
  const existing = await prisma.systemSettings.findFirst()
  if (existing) return existing
  return await prisma.systemSettings.create({ data: {} })
}

export async function getSystemSettings() {
  try {
    return await getOrCreateSettings()
  } catch (error) {
    console.error('getSystemSettings error:', error)
    return null
  }
}

export async function updateSystemSettings(formData: FormData) {
  await requireAdmin()

  const companyName = formData.get('companyName') as string
  const companyAddress = formData.get('companyAddress') as string
  const companyPhone = formData.get('companyPhone') as string
  const companyEmail = formData.get('companyEmail') as string
  const defaultMinStock = Number(formData.get('defaultMinStock')) || 5
  const lowStockAlert = formData.get('lowStockAlert') === 'true'
  const currency = formData.get('currency') as string || 'COP'
  const taxRate = Number(formData.get('taxRate')) || 0
  const receiptFooter = formData.get('receiptFooter') as string

  try {
    const settings = await getOrCreateSettings()
    const updated = await prisma.systemSettings.update({
      where: { id: settings.id },
      data: {
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        defaultMinStock,
        lowStockAlert,
        currency,
        taxRate,
        receiptFooter,
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
