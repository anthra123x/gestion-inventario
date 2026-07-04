'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/modules/auth/auth.actions'
import { generateReportPdf } from '@/lib/pdf'
import * as XLSX from 'xlsx'

interface ReportRepair {
  id: string
  device: string
  problem: string
  diagnosis: string | null
  status: string
  laborCost: number
  notes: string | null
  createdAt: Date
  estimatedDate: Date | null
  dateDelivered: Date | null
  client: { id: string; name: string; phone: string | null } | null
  repairParts: { id: string; quantity: number; unitCost: number; total: number; part: { id: string; name: string } }[]
  [key: string]: unknown
}

interface ReportClient {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  createdAt: Date
  totalSpent: number
  totalTransactions: number
  [key: string]: unknown
}

interface ReportSummary {
  totalRepairs?: number
  totalRevenue?: number
  totalPartsCost?: number
  totalLabor?: number
  averageRepair?: number
  statusStats?: Record<string, { count: number; revenue: number; partsCost: number; laborCost: number }>
  totalClients?: number
  totalSpent?: number
  averageSpent?: number
  newClients?: number
}

const TS = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

function buildWorkbook(data: Record<string, unknown>[], sheetName: string) {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
  return base64
}

export async function exportPartsToExcel() {
  await requireAuth()
  try {
    const parts = await prisma.part.findMany({
      where: { deletedAt: null },
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
  await requireAuth()
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
  await requireAuth()
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

export async function exportReportToExcel(
  reportType: string,
  filters: Record<string, unknown>,
) {
  await requireAuth()
  try {
    const { generateReportData } = await import('@/modules/reports/reports.actions')
    const result = await generateReportData(reportType, filters as Record<string, unknown>)

    if (reportType === 'repairs') {
      const { repairs } = result as unknown as { repairs: ReportRepair[]; summary: ReportSummary }
      const data = repairs.map((r: ReportRepair) => ({
        ID: r.id.slice(-8).toUpperCase(),
        Fecha: new Date(r.createdAt).toLocaleDateString('es-CO'),
        Cliente: r.client?.name || '',
        Dispositivo: r.device,
        Problema: r.problem,
        Diagnóstico: r.diagnosis || '',
        Estado: r.status,
        'Mano de Obra': r.laborCost,
        'Costo Repuestos': r.repairParts?.reduce((s, p) => s + p.total, 0) || 0,
        Total: (r.laborCost || 0) + (r.repairParts?.reduce((s, p) => s + p.total, 0) || 0),
        Notas: r.notes || '',
      }))
      return {
        success: true,
        data: buildWorkbook(data, 'Reparaciones'),
        filename: `reporte_reparaciones_${TS()}.xlsx`,
      }
    }

    if (reportType === 'clients') {
      const { clients } = result as unknown as { clients: ReportClient[]; summary: ReportSummary }
      const data = clients.map((c: ReportClient) => ({
        Nombre: c.name,
        Teléfono: c.phone || '',
        Email: c.email || '',
        Dirección: c.address || '',
        'Total Gastado': c.totalSpent || 0,
        Reparaciones: c.totalTransactions || 0,
        Registro: new Date(c.createdAt).toLocaleDateString('es-CO'),
      }))
      return {
        success: true,
        data: buildWorkbook(data, 'Clientes'),
        filename: `reporte_clientes_${TS()}.xlsx`,
      }
    }

    return { success: false, error: 'Tipo de reporte no válido' }
  } catch {
    return { success: false, error: 'Error al exportar reporte' }
  }
}

export async function exportReportToPdf(
  reportType: string,
  filters: Record<string, unknown>,
) {
  await requireAuth()
  try {
    const { generateReportData } = await import('@/modules/reports/reports.actions')
    const result = await generateReportData(reportType, filters as Record<string, unknown>)

    const { summary } = result as unknown as { summary: ReportSummary; repairs?: ReportRepair[]; clients?: ReportClient[] }
    const rows: ReportRepair[] | ReportClient[] = reportType === 'repairs'
      ? (result as unknown as { repairs: ReportRepair[] }).repairs
      : (result as unknown as { clients: ReportClient[] }).clients

    const pdf = generateReportPdf(reportType, summary, rows)
    const base64 = Buffer.from(pdf).toString('base64')

    return {
      success: true,
      data: base64,
      filename: `reporte_${reportType === 'repairs' ? 'reparaciones' : 'clientes'}_${TS()}.pdf`,
    }
  } catch {
    return { success: false, error: 'Error al exportar reporte a PDF' }
  }
}
