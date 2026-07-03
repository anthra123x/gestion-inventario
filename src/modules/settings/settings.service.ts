import { prisma } from '@/lib/prisma'

export async function getOrCreateSettings() {
  const existing = await prisma.systemSettings.findFirst()
  if (existing) return existing
  return await prisma.systemSettings.create({ data: {} })
}

export async function updateSettings(data: {
  companyName: string
  companyAddress: string | null
  companyPhone: string | null
  companyEmail: string | null
  currency: string
  receiptFooter: string | null
}) {
  const settings = await getOrCreateSettings()
  return await prisma.systemSettings.update({
    where: { id: settings.id },
    data,
  })
}
