'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/modules/auth/auth.actions'
import * as XLSX from 'xlsx'

export async function exportData() {
  await requireAdmin()
  try {
    const [products, sales, repairs, clients, inventoryMovements] = await Promise.all([
      prisma.product.findMany({ where: { deletedAt: null } }),
      prisma.sale.findMany({ include: { saleItems: true, client: true } }),
      prisma.repair.findMany({ include: { repairParts: true, client: true } }),
      prisma.client.findMany({ where: { deletedAt: null } }),
      prisma.inventoryMovement.findMany(),
    ])

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        products.map((p) => ({
          ID: p.id,
          Nombre: p.name,
          Descripción: p.description || '',
          Categoría: p.category,
          Stock: p.stock,
          StockMínimo: p.minStock,
          PrecioCompra: p.purchasePrice,
          PrecioVenta: p.salePrice,
          Proveedor: p.supplier || '',
        })),
      ),
      'Productos',
    )

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        sales.map((s) => ({
          ID: s.id,
          Cliente: s.client?.name || s.clientName || 'Sin cliente',
          Total: s.total,
          MétodoPago: s.paymentMethod,
          Descuento: s.discountAmount,
          Notas: s.notes || '',
          Fecha: new Date(s.createdAt).toISOString(),
        })),
      ),
      'Ventas',
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
          Costo: r.cost,
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

    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(
        inventoryMovements.map((m) => ({
          ID: m.id,
          ProductoID: m.productId,
          Tipo: m.type,
          Cantidad: m.quantity,
          Razón: m.reason || '',
          Fecha: new Date(m.createdAt).toISOString(),
        })),
      ),
      'Movimientos',
    )

    const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' })
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

    return { success: true, data: base64, filename: `backup_${ts}.xlsx` }
  } catch (_error) {
    return { success: false, error: 'Error al exportar datos' }
  }
}

export async function cleanupProducts() {
  await requireAdmin()
  try {
    const deletedMovements = await prisma.inventoryMovement.deleteMany({})
    const deletedProducts = await prisma.product.deleteMany({})

    revalidatePath('/inventory')
    revalidatePath('/admin')

    return {
      success: `Limpieza completada: ${deletedProducts.count} productos y ${deletedMovements.count} movimientos eliminados`,
    }
  } catch (_error) {
    return { error: 'Error al limpiar productos' }
  }
}

export async function cleanupSales() {
  await requireAdmin()
  try {
    await prisma.$transaction(async (tx) => {
      const saleItems = await tx.saleItem.findMany({ select: { productId: true, quantity: true } })
      for (const item of saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
      await tx.saleItem.deleteMany({})
      await tx.sale.deleteMany({})
    })

    revalidatePath('/sales')
    revalidatePath('/admin')

    return { success: 'Limpieza de ventas completada. Stock restaurado.' }
  } catch (_error) {
    return { error: 'Error al limpiar ventas' }
  }
}

export async function cleanupRepairs() {
  await requireAdmin()
  try {
    await prisma.$transaction(async (tx) => {
      const repairParts = await tx.repairPart.findMany({ select: { productId: true, quantity: true } })
      for (const part of repairParts) {
        await tx.product.update({
          where: { id: part.productId },
          data: { stock: { increment: part.quantity } },
        })
      }
      await tx.repairPart.deleteMany({})
      await tx.repair.deleteMany({})
    })

    revalidatePath('/repairs')
    revalidatePath('/admin')

    return { success: 'Limpieza de reparaciones completada. Stock restaurado.' }
  } catch (_error) {
    return { error: 'Error al limpiar reparaciones' }
  }
}

export async function cleanupClients() {
  await requireAdmin()
  try {
    const deletedClients = await prisma.client.deleteMany({})

    revalidatePath('/admin')

    return {
      success: `Limpieza completada: ${deletedClients.count} clientes eliminados`,
    }
  } catch (_error) {
    return { error: 'Error al limpiar clientes' }
  }
}

export async function cleanupAll() {
  await requireAdmin()
  try {
    await prisma.$transaction(async (tx) => {
      const saleItems = await tx.saleItem.findMany({ select: { productId: true, quantity: true } })
      for (const item of saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
      const repairParts = await tx.repairPart.findMany({ select: { productId: true, quantity: true } })
      for (const part of repairParts) {
        await tx.product.update({
          where: { id: part.productId },
          data: { stock: { increment: part.quantity } },
        })
      }
      await tx.saleItem.deleteMany({})
      await tx.repairPart.deleteMany({})
      await tx.inventoryMovement.deleteMany({})
      await tx.sale.deleteMany({})
      await tx.repair.deleteMany({})
      await tx.product.deleteMany({})
      await tx.client.deleteMany({})
    })

    revalidatePath('/inventory')
    revalidatePath('/sales')
    revalidatePath('/repairs')
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return { success: 'Limpieza completa del sistema ejecutada exitosamente' }
  } catch (_error) {
    return { error: 'Error al limpiar el sistema' }
  }
}
