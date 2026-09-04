import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PDFSettings {
  companyName: string
  companyNit: string | null
  companyAddress: string | null
  companyCity: string | null
  companyPhone: string | null
  companyEmail: string | null
  invoicePrefix: string
  invoiceFooter: string | null
  currency: string
}

const defaultPDFSettings: PDFSettings = {
  companyName: 'Cilmax',
  companyNit: null,
  companyAddress: null,
  companyCity: null,
  companyPhone: null,
  companyEmail: null,
  invoicePrefix: 'CIL-',
  invoiceFooter: null,
  currency: 'COP',
}

function fmt(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

const COL = {
  black: [26, 26, 26] as [number, number, number],
  gray: [120, 120, 120] as [number, number, number],
  lightGray: [220, 220, 220] as [number, number, number],
  text: [60, 60, 60] as [number, number, number],
  muted: [150, 150, 150] as [number, number, number],
  tableBg: [248, 248, 248] as [number, number, number],
  teal: [13, 148, 136] as [number, number, number],
  tealLight: [240, 253, 250] as [number, number, number],
  gold: [245, 158, 11] as [number, number, number],
}

interface PDFSaleItem {
  quantity: number
  unitPrice: number
  total: number
  product: { name: string }
}

interface PDFSale {
  id: string
  invoiceNumber: string
  subtotal: number
  discount: number
  total: number
  paymentMethod: string
  saleDate: Date | string
  client?: {
    name: string
    phone: string | null
    email: string | null
    address: string | null
  } | null
  items: PDFSaleItem[]
  user?: { name: string } | null
  invoice?: {
    companyName: string
    companyNit: string | null
    companyAddress: string | null
    companyCity: string | null
    companyPhone: string | null
    companyEmail: string | null
    currency: string
    invoiceFooter: string | null
  } | null
}

export function generateSaleInvoicePdf(sale: PDFSale, pdfSettings?: PDFSettings): Uint8Array {
  const s = { ...defaultPDFSettings, ...pdfSettings }

  // Use invoice snapshot if available (frozen company data at time of sale)
  const company = sale.invoice || null

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

  // Company header
  doc.setFillColor(...COL.teal)
  doc.circle(m + 4, y - 2, 5, 'F')
  doc.setFillColor(...COL.gold)
  doc.circle(m + 4, y - 2, 2.2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...COL.black)
  doc.text(company?.companyName || s.companyName, m + 14, y + 1)

  // Company details
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...COL.muted)
  const companyDetails: string[] = []
  if (company?.companyNit || s.companyNit) companyDetails.push(`NIT: ${company?.companyNit || s.companyNit}`)
  const location = [company?.companyAddress || s.companyAddress, company?.companyCity || s.companyCity]
    .filter(Boolean)
    .join(', ')
  if (location) companyDetails.push(location)
  if (company?.companyPhone || s.companyPhone) companyDetails.push(`Tel: ${company?.companyPhone || s.companyPhone}`)
  if (company?.companyEmail || s.companyEmail) companyDetails.push(`Email: ${company?.companyEmail || s.companyEmail}`)
  if (companyDetails.length > 0) {
    doc.text(companyDetails.join(' | '), m + 14, y + 6)
  }

  // Invoice badge
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.setTextColor(100, 100, 100)
  const badge = 'FACTURA DE VENTA'
  const bw = doc.getTextWidth(badge) + 8
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(250, 250, 250)
  doc.roundedRect(pw - m - bw - 4, y - 4, bw + 6, 8, 1, 1, 'FD')
  doc.text(badge, pw - m - (bw + 6) / 2, y + 1.5, { align: 'center' })

  // Invoice number
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COL.black)
  doc.text(`#${sale.invoiceNumber}`, pw - m, y + 11, { align: 'right' })

  y += 20
  divider()

  // Sale info
  const saleDate = new Date(sale.saleDate)
  const dateStr = saleDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = saleDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })

  const paymentLabels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`Fecha: ${dateStr} ${timeStr}`, m, y)
  doc.text(`Pago: ${paymentLabels[sale.paymentMethod] || sale.paymentMethod}`, pw - m, y, { align: 'right' })
  y += 6

  // Client
  if (sale.client) {
    sectionHdr('Cliente')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...COL.black)
    doc.text(sale.client.name, m, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)
    if (sale.client.phone) {
      doc.text(`Tel: ${sale.client.phone}`, m, y)
      y += 4
    }
    if (sale.client.email) {
      doc.text(`Email: ${sale.client.email}`, m, y)
      y += 4
    }
    if (sale.client.address) {
      doc.text(`Dir: ${sale.client.address}`, m, y)
      y += 4
    }
    y += 2
  }

  divider()

  // Items table
  sectionHdr('Productos')

  const tableData = sale.items.map((item) => [
    item.product.name,
    item.quantity.toString(),
    `$${fmt(item.unitPrice)}`,
    `$${fmt(item.total)}`,
  ])

  autoTable(doc, {
    startY: y + 2,
    head: [['Producto', 'Cant.', 'Precio Unit.', 'Total']],
    body: tableData,
    margin: { left: m, right: m },
    tableWidth: cw,
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [...COL.teal], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
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

  // Totals
  sectionHdr('Resumen')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text('Subtotal', m, y)
  doc.text(`$${fmt(sale.subtotal)}`, pw - m, y, { align: 'right' })
  y += 6

  if (sale.discount > 0) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(180, 50, 50)
    doc.text('Descuento', m, y)
    doc.text(`-$${fmt(sale.discount)}`, pw - m, y, { align: 'right' })
    y += 6
  }

  doc.setDrawColor(...COL.black)
  doc.setLineWidth(0.5)
  doc.line(m, y, pw - m, y)
  doc.setLineWidth(0.1)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...COL.teal)
  doc.text('TOTAL', m, y)
  doc.text(`$${fmt(sale.total)}`, pw - m, y, { align: 'right' })
  y += 8

  // Footer
  divider()
  const footerText =
    company?.invoiceFooter || s.invoiceFooter || `${company?.companyName || s.companyName} — Gracias por su compra`
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COL.teal)
  doc.text(footerText, pw / 2, y - 4, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Conserve esta factura para efectos de garantía del producto.', pw / 2, y, { align: 'center' })

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
