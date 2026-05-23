'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/modules/auth/auth.actions'

export async function exportData() {
  await requireAdmin()
  try {
    const [products, sales, repairs, clients, inventoryMovements] = await Promise.all([
      prisma.product.findMany({
        where: { deletedAt: null },
      }),
      prisma.sale.findMany({
        include: { saleItems: true, client: true },
      }),
      prisma.repair.findMany({
        include: { repairParts: true, client: true },
      }),
      prisma.client.findMany({
        where: { deletedAt: null },
      }),
      prisma.inventoryMovement.findMany(),
    ])

    const data = {
      products,
      sales,
      repairs,
      clients,
      inventoryMovements,
      exportedAt: new Date().toISOString(),
    }

    return {
      success: true,
      data,
    }
  } catch (_error) {
    return {
      success: false,
      error: 'Error al exportar datos',
    }
  }
}

export async function cleanupProducts() {
  await requireAdmin()
  try {
    console.log('=== CLEANUP PRODUCTS STARTED ===')

    // Eliminar movimientos de inventario
    const deletedMovements = await prisma.inventoryMovement.deleteMany({})
    console.log('Movimientos de inventario eliminados:', deletedMovements.count)

    // Eliminar productos (incluso con relaciones)
    const deletedProducts = await prisma.product.deleteMany({})
    console.log('Productos eliminados:', deletedProducts.count)

    revalidatePath('/inventory')
    revalidatePath('/admin')

    return {
      success: `Limpieza completada: ${deletedProducts.count} productos y ${deletedMovements.count} movimientos eliminados`,
    }
  } catch (_error) {
    return {
      error: 'Error al limpiar productos',
    }
  }
}

export async function cleanupSales() {
  await requireAdmin()
  try {
    console.log('=== CLEANUP SALES STARTED ===')

    // Eliminar sale items primero
    const deletedSaleItems = await prisma.saleItem.deleteMany({})
    console.log('Sale items eliminados:', deletedSaleItems.count)

    // Eliminar ventas
    const deletedSales = await prisma.sale.deleteMany({})
    console.log('Ventas eliminadas:', deletedSales.count)

    revalidatePath('/sales')
    revalidatePath('/admin')

    return {
      success: `Limpieza completada: ${deletedSales.count} ventas y ${deletedSaleItems.count} items eliminados`,
    }
  } catch (_error) {
    return {
      error: 'Error al limpiar ventas',
    }
  }
}

export async function cleanupRepairs() {
  await requireAdmin()
  try {
    console.log('=== CLEANUP REPAIRS STARTED ===')

    // Eliminar repair parts primero
    const deletedRepairParts = await prisma.repairPart.deleteMany({})
    console.log('Repair parts eliminados:', deletedRepairParts.count)

    // Eliminar reparaciones
    const deletedRepairs = await prisma.repair.deleteMany({})
    console.log('Reparaciones eliminadas:', deletedRepairs.count)

    revalidatePath('/repairs')
    revalidatePath('/admin')

    return {
      success: `Limpieza completada: ${deletedRepairs.count} reparaciones y ${deletedRepairParts.count} repuestos eliminados`,
    }
  } catch (_error) {
    return {
      error: 'Error al limpiar reparaciones',
    }
  }
}

export async function cleanupClients() {
  await requireAdmin()
  try {
    console.log('=== CLEANUP CLIENTS STARTED ===')

    const deletedClients = await prisma.client.deleteMany({})
    console.log('Clientes eliminados:', deletedClients.count)

    revalidatePath('/admin')

    return {
      success: `Limpieza completada: ${deletedClients.count} clientes eliminados`,
    }
  } catch (_error) {
    return {
      error: 'Error al limpiar clientes',
    }
  }
}

export async function cleanupAll() {
  await requireAdmin()
  try {
    const _result = await prisma.$transaction(async (tx) => {
      const deletedSaleItems = await tx.saleItem.deleteMany({})
      const deletedRepairParts = await tx.repairPart.deleteMany({})
      const deletedMovements = await tx.inventoryMovement.deleteMany({})
      const deletedSales = await tx.sale.deleteMany({})
      const deletedRepairs = await tx.repair.deleteMany({})
      const deletedProducts = await tx.product.deleteMany({})
      const deletedClients = await tx.client.deleteMany({})
      return {
        deletedSaleItems,
        deletedRepairParts,
        deletedMovements,
        deletedSales,
        deletedRepairs,
        deletedProducts,
        deletedClients,
      }
    })

    revalidatePath('/inventory')
    revalidatePath('/sales')
    revalidatePath('/repairs')
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return {
      success: 'Limpieza completa del sistema ejecutada exitosamente',
    }
  } catch (_error) {
    return {
      error: 'Error al limpiar el sistema',
    }
  }
}
