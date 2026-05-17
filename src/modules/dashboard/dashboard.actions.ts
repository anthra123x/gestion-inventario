'use server'

import { prisma } from '@/lib/prisma'
import { getLowStockProducts } from '@/modules/inventory/inventory.actions'
import { getSalesStats } from '@/modules/sales/sales.actions'
import { getRepairStats } from '@/modules/repairs/repairs.actions'
import { getClientStats } from '@/modules/clients/clients.actions'

export async function getDashboardStats() {
  const [
    salesStats,
    repairStats,
    clientStats,
    lowStockProducts,
    recentSales,
    recentRepairs,
  ] = await Promise.all([
    getSalesStats(new Date(new Date().getFullYear(), new Date().getMonth(), 1), new Date()),
    getRepairStats(),
    getClientStats(),
    getLowStockProducts(),
    getRecentSales(),
    getRecentRepairs(),
  ])

  return {
    salesStats,
    repairStats,
    clientStats,
    lowStockProducts,
    recentSales,
    recentRepairs,
  }
}

async function getRecentSales() {
  return await prisma.sale.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      total: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

async function getRecentRepairs() {
  return await prisma.repair.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      device: true,
      status: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })
}

export async function getSalesByMonth(months: number = 12) {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const sales = await prisma.sale.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
      total: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by month
  const salesByMonth = sales.reduce((acc, sale) => {
    const date = new Date(sale.createdAt)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        total: 0,
        count: 0,
      }
    }
    
    acc[monthKey].total += sale.total
    acc[monthKey].count += 1
    
    return acc
  }, {} as Record<string, { month: string; total: number; count: number }>)

  return Object.values(salesByMonth)
}

export async function getTopProducts(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const topProducts = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: {
      sale: {
        createdAt: {
          gte: startDate,
        },
      },
    },
    _sum: {
      quantity: true,
      total: true,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _sum: {
        quantity: 'desc',
      },
    },
    take: 10,
  })

  // Get product details
  const productIds = topProducts.map(item => item.productId)
  const products = await prisma.product.findMany({
    where: {
      id: {
        in: productIds,
      },
    },
    select: {
      id: true,
      name: true,
      category: true,
    },
  })

  return topProducts.map(item => ({
    ...item,
    product: products.find(p => p.id === item.productId),
  }))
}

export async function getProductsByCategory() {
  const products = await prisma.product.groupBy({
    by: ['category'],
    where: { deletedAt: null },
    _count: {
      id: true,
    },
    _sum: {
      stock: true,
    },
  })

  return products.map(item => ({
    category: item.category,
    count: item._count.id,
    totalStock: item._sum.stock || 0,
  }))
}

export async function getRepairsByStatus() {
  const repairs = await prisma.repair.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  })

  return repairs
}

export async function getRevenueByPaymentMethod(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const revenue = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    _sum: {
      total: true,
    },
    _count: {
      id: true,
    },
  })

  return revenue
}
