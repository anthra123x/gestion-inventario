import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getRepairStatusLabel } from '@/lib/labels'

function fmt(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const COL = {
  black: [26, 26, 26] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  lightGray: [220, 220, 220] as [number, number, number],
  text: [60, 60, 60] as [number, number, number],
  muted: [150, 150, 150] as [number, number, number],
  tableBg: [248, 248, 248] as [number, number, number],
  warrantyBg: [248, 248, 248] as [number, number, number],
}

interface PDFRepairPart {
  quantity: number
  unitCost: number
  total: number
  part: { name: string }
}

interface PDFRepair {
  id: string
  device: string
  problem: string
  diagnosis: string | null
  laborCost: number
  notes: string | null
  client: {
    name: string
    phone: string | null
    email: string | null
    address: string | null
  }
  repairParts: PDFRepairPart[]
  user: { name: string } | null
}

export function generateRepairPdf(repair: PDFRepair): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()
  const m = 20
  const cw = pw - 2 * m

  let y = 25

  function sectionHdr(text: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COL.gray)
    doc.text(text.toUpperCase(), m, y)
    doc.setTextColor(0, 0, 0)
    y += 5
  }

  function divider() {
    doc.setDrawColor(...COL.lightGray)
    doc.line(m, y, pw - m, y)
    y += 6
  }

  doc.setFillColor(...COL.black)
  doc.roundedRect(m, y - 6, 8, 8, 1.5, 1.5, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...COL.black)
  doc.text('Gestión Reparaciones', m + 14, y + 1)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COL.muted)
  doc.text('Centro de Servicio Técnico', m + 14, y + 6)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const badge = 'FICHA TÉCNICA'
  const bw = doc.getTextWidth(badge) + 8
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(pw - m - bw - 4, y - 4, bw + 6, 8, 1, 1, 'FD')
  doc.text(badge, pw - m - (bw + 6) / 2, y + 1.5, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COL.black)
  doc.text(`#REP-${repair.id.slice(-6).toUpperCase()}`, pw - m, y + 11, { align: 'right' })

  y += 20
  divider()

  sectionHdr('Cliente')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...COL.black)
  doc.text(repair.client.name, m, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  const clientFields: string[] = []
  if (repair.client.phone) clientFields.push(`Tel: ${repair.client.phone}`)
  if (repair.client.email) clientFields.push(`Email: ${repair.client.email}`)
  if (repair.client.address) clientFields.push(`Dir: ${repair.client.address}`)
  for (const f of clientFields) {
    doc.text(f, m, y)
    y += 4
  }
  if (clientFields.length > 0) y += 2

  sectionHdr('Dispositivo')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...COL.black)
  doc.text(repair.device, m, y)
  y += 8

  divider()

  sectionHdr('Problema Reportado')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...COL.text)
  const probLines = doc.splitTextToSize(repair.problem, cw)
  doc.text(probLines, m, y)
  y += probLines.length * 5 + 4

  if (repair.diagnosis) {
    sectionHdr('Diagnóstico Técnico')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COL.text)
    const diagLines = doc.splitTextToSize(repair.diagnosis, cw)
    doc.text(diagLines, m, y)
    y += diagLines.length * 5 + 4
  }

  if (repair.repairParts.length > 0) {
    divider()
    sectionHdr('Repuestos Utilizados')

    const partsTotal = repair.repairParts.reduce((s, p) => s + p.total, 0)
    const laborCost = repair.laborCost

    const tableData = repair.repairParts.map((p) => [
      p.part.name,
      p.quantity.toString(),
      `$${fmt(p.unitCost)}`,
      `$${fmt(p.total)}`,
    ])

    autoTable(doc, {
      startY: y + 2,
      head: [['Producto', 'Cant.', 'Precio Unit.', 'Total']],
      body: tableData,
      margin: { left: m, right: m },
      tableWidth: cw,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [...COL.black], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [...COL.tableBg] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' },
      },
      didDrawPage: (data) => {
        y = (data.cursor?.y ?? y) + 8
      },
    })

    sectionHdr('Resumen de Costos')

    if (partsTotal > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(80, 80, 80)
      doc.text('Repuestos', m, y)
      doc.text(`$${fmt(partsTotal)}`, pw - m, y, { align: 'right' })
      y += 6
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(80, 80, 80)
    doc.text('Mano de obra', m, y)
    doc.text(`$${fmt(laborCost)}`, pw - m, y, { align: 'right' })
    y += 4

    doc.setDrawColor(...COL.black)
    doc.setLineWidth(0.5)
    doc.line(m, y, pw - m, y)
    doc.setLineWidth(0.1)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...COL.black)
    doc.text('TOTAL', m, y)
    doc.text(`$${fmt(repair.laborCost + partsTotal)}`, pw - m, y, { align: 'right' })
    y += 8
  } else {
    divider()
    sectionHdr('Costo')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...COL.black)
    doc.text(`$${fmt(repair.laborCost)}`, m, y)
    y += 6
  }

  if (repair.notes) {
    divider()
    sectionHdr('Notas')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(...COL.text)
    const noteLines = doc.splitTextToSize(repair.notes, cw)
    doc.text(noteLines, m, y)
    y += noteLines.length * 5 + 4
  }

  divider()
  sectionHdr('Técnico Responsable')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COL.black)
  doc.text(repair.user?.name || '—', m, y)
  y += 8

  if (y > 230) {
    doc.addPage()
    y = 25
  }

  doc.setDrawColor(...COL.lightGray)
  doc.setFillColor(...COL.warrantyBg)
  doc.roundedRect(m, y, cw, 30, 2, 2, 'FD')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.text('GARANTÍA', m + 4, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(130, 130, 130)
  const warrantyLines = doc.splitTextToSize(
    'Este servicio técnico cuenta con una garantía de 30 días en mano de obra a partir de la fecha de entrega. Los repuestos instalados cubren la garantía otorgada por el fabricante. La garantía no cubre daños por mal uso, golpes, humedad o manipulación por terceros no autorizados.',
    cw - 8,
  )
  doc.text(warrantyLines, m + 4, y + 12)

  y += 38

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COL.black)
  doc.text('Gestión Reparaciones — Centro de Servicio Técnico', pw / 2, y, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(180, 180, 180)
  const now = new Date()
  const ds = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const ts = now.toLocaleTimeString('es-CO')
  doc.text(`Documento generado el ${ds} a las ${ts}`, pw / 2, y + 4, { align: 'center' })

  const buf = doc.output('arraybuffer')
  return new Uint8Array(buf)
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

interface ReportRow {
  id: string
  client?: { name: string; phone?: string | null } | null
  device?: string
  problem?: string
  laborCost?: number
  status?: string
  createdAt?: string | Date
  name?: string
  phone?: string | null
  email?: string | null
  totalSpent?: number
  totalTransactions?: number
  repairParts?: { total: number }[]
}

export function generateReportPdf(
  reportType: string,
  summary: ReportSummary,
  rows: ReportRow[],
): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pw = doc.internal.pageSize.getWidth()
  const m = 20
  const cw = pw - 2 * m

  let y = 25

  function sectionHdr(text: string) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text(text.toUpperCase(), m, y)
    y += 5
  }

  function divider() {
    doc.setDrawColor(220, 220, 220)
    doc.line(m, y, pw - m, y)
    y += 6
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(26, 26, 26)
  doc.text('Gestión Reparaciones', m, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text('Centro de Servicio Técnico', m, y)
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(26, 26, 26)
  const title = reportType === 'repairs' ? 'Reporte de Reparaciones' : 'Reporte de Clientes'
  doc.text(title, m, y + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.text(`Generado el ${dateStr}`, pw - m, y + 6, { align: 'right' })

  y += 14
  divider()

  sectionHdr('Resumen')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(26, 26, 26)

  if (reportType === 'repairs') {
    const summaryData: [string, string][] = [
      ['Total Reparaciones', String(summary.totalRepairs ?? 0)],
      ['Total Facturado', `$${fmt(summary.totalRevenue ?? 0)}`],
      ['Costo Repuestos', `$${fmt(summary.totalPartsCost ?? 0)}`],
      ['Mano de Obra', `$${fmt(summary.totalLabor ?? 0)}`],
      ['Promedio por Reparación', `$${fmt(summary.averageRepair ?? 0)}`],
    ]
    for (const [label, value] of summaryData) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      doc.text(label, m, y)
      doc.setFont('helvetica', 'bold')
      doc.text(value, pw - m, y, { align: 'right' })
      y += 5
    }
    y += 2

    if (summary.statusStats && Object.keys(summary.statusStats).length > 0) {
      sectionHdr('Por Estado')
      autoTable(doc, {
        startY: y + 2,
        head: [['Estado', 'Cantidad', 'Facturado', 'Repuestos', 'Mano Obra']],
        body: Object.entries(summary.statusStats).map(([status, sd]) => [
          getRepairStatusLabel(status),
          sd.count.toString(),
          `$${fmt(sd.revenue)}`,
          `$${fmt(sd.partsCost)}`,
          `$${fmt(sd.laborCost)}`,
        ]),
        margin: { left: m, right: m },
        tableWidth: cw,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' },
        },
      })
    }
  } else {
    const summaryData: [string, string][] = [
      ['Total Clientes', String(summary.totalClients ?? 0)],
      ['Gasto Total', `$${fmt(summary.totalSpent ?? 0)}`],
      ['Gasto Promedio', `$${fmt(summary.averageSpent ?? 0)}`],
      ['Nuevos Clientes', String(summary.newClients ?? 0)],
    ]
    for (const [label, value] of summaryData) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(80, 80, 80)
      doc.text(label, m, y)
      doc.setFont('helvetica', 'bold')
      doc.text(value, pw - m, y, { align: 'right' })
      y += 5
    }
  }

  const tableStartY = y + 8

  if (rows.length > 0) {
    if (reportType === 'repairs') {
      const tableData = rows.map((r) => [
        `#${r.id.slice(-6).toUpperCase()}`,
        r.client?.name || '—',
        r.device || '—',
        getRepairStatusLabel(r.status || ''),
        `$${fmt(r.laborCost ?? 0)}`,
      ])

      autoTable(doc, {
        startY: tableStartY,
        head: [['ID', 'Cliente', 'Dispositivo', 'Estado', 'Mano Obra']],
        body: tableData,
        margin: { left: m, right: m },
        tableWidth: cw,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 25 },
          4: { cellWidth: 30, halign: 'right' },
        },
      })
    } else {
      const tableData = rows.map((c) => [
        c.name || '—',
        c.phone || '—',
        `$${fmt(c.totalSpent ?? 0)}`,
        String(c.totalTransactions ?? 0),
      ])

      autoTable(doc, {
        startY: tableStartY,
        head: [['Cliente', 'Teléfono', 'Total Gastado', 'Reparaciones']],
        body: tableData,
        margin: { left: m, right: m },
        tableWidth: cw,
        styles: { fontSize: 8, cellPadding: 2.5 },
        headStyles: { fillColor: [26, 26, 26], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 35 },
          2: { cellWidth: 35, halign: 'right' },
          3: { cellWidth: 25, halign: 'center' },
        },
      })
    }
  }

  const buf = doc.output('arraybuffer')
  return new Uint8Array(buf)
}
