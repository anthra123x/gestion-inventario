'use server'

import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/modules/auth/auth.actions'

const TS = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

export async function exportProductsToExcel() {
  await requireAdmin()
  try {
    const products = await prisma.product.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })

    const data = products.map(p => ({
      Nombre: p.name,
      Descripción: p.description || '',
      Categoría: p.category,
      Stock: p.stock,
      StockMínimo: p.minStock,
      PrecioCompra: p.purchasePrice,
      PrecioVenta: p.salePrice,
      Proveedor: p.supplier || '',
    }))

    return {
      success: true,
      data,
      filename: `productos_${TS()}.xlsx`,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error al exportar productos',
    }
  }
}

export async function exportSalesToExcel() {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        client: true,
        saleItems: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = sales.map(s => ({
      ID: s.id.slice(-8).toUpperCase(),
      Fecha: new Date(s.createdAt).toLocaleDateString('es-CO'),
      Cliente: s.client?.name || s.clientName || 'Sin cliente',
      Total: s.total,
      MétodoPago: s.paymentMethod,
      Notas: s.notes || '',
    }))

    return {
      success: true,
      data,
      filename: `ventas_${TS()}.xlsx`,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error al exportar ventas',
    }
  }
}

export async function exportRepairsToExcel() {
  try {
    const repairs = await prisma.repair.findMany({
      include: {
        client: true,
        repairParts: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const data = repairs.map(r => ({
      ID: r.id.slice(-8).toUpperCase(),
      Fecha: new Date(r.createdAt).toLocaleDateString('es-CO'),
      Cliente: r.client?.name || 'Sin cliente',
      Dispositivo: r.device,
      Problema: r.problem,
      Diagnóstico: r.diagnosis || '',
      Estado: r.status,
      Costo: r.cost,
      FechaEstimada: r.estimatedDate ? new Date(r.estimatedDate).toLocaleDateString('es-CO') : '',
      Notas: r.notes || '',
    }))

    return {
      success: true,
      data,
      filename: `reparaciones_${TS()}.xlsx`,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error al exportar reparaciones',
    }
  }
}

export async function exportClientsToExcel() {
  try {
    const clients = await prisma.client.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    })

    const data = clients.map(c => ({
      Nombre: c.name,
      Teléfono: c.phone,
      Email: c.email || '',
      Dirección: c.address || '',
      FechaRegistro: new Date(c.createdAt).toLocaleDateString('es-CO'),
    }))

    return {
      success: true,
      data,
      filename: `clientes_${TS()}.xlsx`,
    }
  } catch (error) {
    return {
      success: false,
      error: 'Error al exportar clientes',
    }
  }
}
