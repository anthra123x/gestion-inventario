'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/modules/auth/auth.actions'
import * as XLSX from 'xlsx'

const TS = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

function buildWorkbook(data: Record<string, unknown>[], sheetName: string) {
  const workbook = XLSX.utils.book_new()
  const worksheet = XLSX.utils.json_to_sheet(data)
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
  return base64
}

export async function exportProductsToExcel() {
  await requireAuth()
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      include: { category: true, supplier: true },
      orderBy: { name: 'asc' },
    })

    const data = products.map((p) => ({
      Nombre: p.name,
      Descripción: p.description || '',
      'Código de Barras': p.barcode || '',
      Categoría: p.category?.name || '',
      Proveedor: p.supplier?.name || '',
      'Costo (COP)': p.costPrice,
      'Precio Venta (COP)': p.salePrice,
      Stock: p.stock,
    }))

    return {
      success: true,
      data: buildWorkbook(data, 'Productos'),
      filename: `productos_${TS()}.xlsx`,
    }
  } catch {
    return { success: false, error: 'Error al exportar productos' }
  }
}

export async function exportSalesToExcel() {
  await requireAuth()
  try {
    const sales = await prisma.sale.findMany({
      include: { client: true, items: { include: { product: true } } },
      orderBy: { saleDate: 'desc' },
    })

    const data = sales.map((s) => ({
      'No. Factura': s.invoiceNumber,
      Fecha: new Date(s.saleDate).toLocaleDateString('es-CO'),
      Cliente: s.client?.name || 'Consumidor final',
      Subtotal: s.subtotal,
      Descuento: s.discount,
      Total: s.total,
      'Método de Pago': s.paymentMethod,
      Estado: s.status,
    }))

    return {
      success: true,
      data: buildWorkbook(data, 'Ventas'),
      filename: `ventas_${TS()}.xlsx`,
    }
  } catch {
    return { success: false, error: 'Error al exportar ventas' }
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
      Teléfono: c.phone || '',
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

export async function exportInventoryToExcel() {
  await requireAuth()
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })

    const data = products.map((p) => ({
      Nombre: p.name,
      Stock: p.stock,
      'Stock Mínimo': p.lowStockThreshold,
      'Precio Venta (COP)': p.salePrice,
      'Costo (COP)': p.costPrice,
    }))

    return {
      success: true,
      data: buildWorkbook(data, 'Inventario'),
      filename: `inventario_${TS()}.xlsx`,
    }
  } catch {
    return { success: false, error: 'Error al exportar inventario' }
  }
}
