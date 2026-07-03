'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/modules/auth/auth.actions'
import * as XLSX from 'xlsx'

const TS = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

function buildWorkbook(data: Record<string, unknown>[], sheetName: string) {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
  return base64
}

export async function exportPartsToExcel() {
  await requireAdmin()
  try {
    const parts = await prisma.part.findMany({
      orderBy: { name: 'asc' },
    })

    const data = parts.map((p) => ({
      Nombre: p.name,
      Descripción: p.description || '',
      Proveedor: p.supplier || '',
      Precio: p.price,
    }))

    return {
      success: true,
      data: buildWorkbook(data, 'Repuestos'),
      filename: `repuestos_${TS()}.xlsx`,
    }
  } catch {
    return { success: false, error: 'Error al exportar repuestos' }
  }
}

export async function exportRepairsToExcel() {
  await requireAdmin()
  try {
    const repairs = await prisma.repair.findMany({
      include: { client: true, repairParts: { include: { part: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const data = repairs.map((r) => ({
      ID: r.id.slice(-8).toUpperCase(),
      Fecha: new Date(r.createdAt).toLocaleDateString('es-CO'),
      Cliente: r.client?.name || 'Sin cliente',
      Dispositivo: r.device,
      Problema: r.problem,
      Diagnóstico: r.diagnosis || '',
      Estado: r.status,
      ManoObra: r.laborCost,
      CostoRepuestos: r.repairParts.reduce((s, p) => s + p.total, 0),
      FechaEstimada: r.estimatedDate ? new Date(r.estimatedDate).toLocaleDateString('es-CO') : '',
      Notas: r.notes || '',
    }))

    return {
      success: true,
      data: buildWorkbook(data, 'Reparaciones'),
      filename: `reparaciones_${TS()}.xlsx`,
    }
  } catch {
    return { success: false, error: 'Error al exportar reparaciones' }
  }
}

export async function exportClientsToExcel() {
  await requireAdmin()
  try {
    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })

    const data = clients.map((c) => ({
      Nombre: c.name,
      Teléfono: c.phone,
      Email: c.email || '',
      Dirección: c.address || '',
      FechaRegistro: new Date(c.createdAt).toLocaleDateString('es-CO'),
    }))

    return {
      success: true,
      data: buildWorkbook(data, 'Clientes'),
      filename: `clientes_${TS()}.xlsx`,
    }
  } catch {
    return { success: false, error: 'Error al exportar clientes' }
  }
}
