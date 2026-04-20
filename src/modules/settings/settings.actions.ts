'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSystemSettings() {
  let settings = await prisma.systemSettings.findFirst()

  if (!settings) {
    settings = await prisma.systemSettings.create({
      data: {},
    })
  }

  return settings
}

export async function updateSystemSettings(formData: FormData) {
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
    let settings = await prisma.systemSettings.findFirst()

    if (!settings) {
      settings = await prisma.systemSettings.create({
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
    } else {
      settings = await prisma.systemSettings.update({
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
    }

    revalidatePath('/admin')
    return {
      success: 'Configuración actualizada exitosamente',
      settings,
    }
  } catch (error) {
    return {
      error: 'Error al actualizar configuración',
    }
  }
}
