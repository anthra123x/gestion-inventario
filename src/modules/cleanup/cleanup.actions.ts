'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function exportData() {
  try {
    const [products, sales, repairs, clients, inventoryMovements] = await Promise.all([
      prisma.product.findMany(),
      prisma.sale.findMany({
        include: { saleItems: true, client: true },
      }),
      prisma.repair.findMany({
        include: { repairParts: true, client: true },
      }),
      prisma.client.findMany(),
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
  } catch (error) {
    console.error('Error exporting data:', error)
    return {
      success: false,
      error: 'Error al exportar datos',
    }
  }
}

export async function cleanupProducts() {
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
  } catch (error) {
    console.error('Error cleaning up products:', error)
    return {
      error: 'Error al limpiar productos',
    }
  }
}

export async function cleanupSales() {
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
  } catch (error) {
    console.error('Error cleaning up sales:', error)
    return {
      error: 'Error al limpiar ventas',
    }
  }
}

export async function cleanupRepairs() {
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
  } catch (error) {
    console.error('Error cleaning up repairs:', error)
    return {
      error: 'Error al limpiar reparaciones',
    }
  }
}

export async function cleanupClients() {
  try {
    console.log('=== CLEANUP CLIENTS STARTED ===')

    const deletedClients = await prisma.client.deleteMany({})
    console.log('Clientes eliminados:', deletedClients.count)

    revalidatePath('/admin')

    return {
      success: `Limpieza completada: ${deletedClients.count} clientes eliminados`,
    }
  } catch (error) {
    console.error('Error cleaning up clients:', error)
    return {
      error: 'Error al limpiar clientes',
    }
  }
}

export async function cleanupAll() {
  try {
    console.log('=== CLEANUP ALL STARTED ===')

    // Orden de eliminación: relaciones primero
    const deletedSaleItems = await prisma.saleItem.deleteMany({})
    const deletedRepairParts = await prisma.repairPart.deleteMany({})
    const deletedMovements = await prisma.inventoryMovement.deleteMany({})

    const deletedSales = await prisma.sale.deleteMany({})
    const deletedRepairs = await prisma.repair.deleteMany({})
    const deletedProducts = await prisma.product.deleteMany({})
    const deletedClients = await prisma.client.deleteMany({})

    console.log('Limpieza completa:')
    console.log('  - SaleItems:', deletedSaleItems.count)
    console.log('  - RepairParts:', deletedRepairParts.count)
    console.log('  - InventoryMovements:', deletedMovements.count)
    console.log('  - Sales:', deletedSales.count)
    console.log('  - Repairs:', deletedRepairs.count)
    console.log('  - Products:', deletedProducts.count)
    console.log('  - Clients:', deletedClients.count)

    revalidatePath('/inventory')
    revalidatePath('/sales')
    revalidatePath('/repairs')
    revalidatePath('/admin')
    revalidatePath('/dashboard')

    return {
      success: 'Limpieza completa del sistema ejecutada exitosamente',
    }
  } catch (error) {
    console.error('Error cleaning up all:', error)
    return {
      error: 'Error al limpiar el sistema',
    }
  }
}
