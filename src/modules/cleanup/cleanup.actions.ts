'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/modules/auth/auth.actions'
import * as XLSX from 'xlsx'

export async function exportData() {
  await requireAdmin()
  try {
    const [parts, repairs, clients] = await Promise.all([
      prisma.part.findMany({ where: { deletedAt: null } }),
      prisma.repair.findMany({ include: { repairParts: { include: { part: true } }, client: true } }),
      prisma.client.findMany({ where: { deletedAt: null } }),
    ])

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        parts.map((p) => ({
          ID: p.id,
          Nombre: p.name,
          Descripción: p.description || '',
          Proveedor: p.supplier || '',
          Precio: p.price,
        })),
      ),
      'Repuestos',
    )

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        repairs.map((r) => ({
          ID: r.id,
          Cliente: r.client?.name || 'Sin cliente',
          Dispositivo: r.device,
          Problema: r.problem,
          Diagnóstico: r.diagnosis || '',
          Estado: r.status,
          ManoObra: r.laborCost,
          Fecha: new Date(r.createdAt).toISOString(),
        })),
      ),
      'Reparaciones',
    )

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        clients.map((c) => ({
          ID: c.id,
          Nombre: c.name,
          Teléfono: c.phone || '',
          Email: c.email || '',
          Dirección: c.address || '',
          Fecha: new Date(c.createdAt).toISOString(),
        })),
      ),
      'Clientes',
    )

    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

    return { success: true, data: base64, filename: `backup_${ts}.xlsx` }
  } catch {
    return { success: false, error: 'Error al exportar datos' }
  }
}

export async function cleanupRepairs() {
  await requireAdmin()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.repairPart.deleteMany({})
      await tx.repair.deleteMany({})
    })

    revalidatePath('/repairs')
    revalidatePath('/admin')

    return { success: 'Limpieza de reparaciones completada.' }
  } catch {
    return { error: 'Error al limpiar reparaciones' }
  }
}

export async function cleanupAll() {
  await requireAdmin()
  try {
    await prisma.$transaction(async (tx) => {
      await tx.repairPart.deleteMany({})
      await tx.repair.deleteMany({})
      await tx.part.deleteMany({})
      await tx.client.deleteMany({})
    })

    revalidatePath('/repairs')
    revalidatePath('/inventory')
    revalidatePath('/clients')
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return { success: 'Limpieza completa del sistema ejecutada exitosamente' }
  } catch {
    return { error: 'Error al limpiar el sistema' }
  }
}
