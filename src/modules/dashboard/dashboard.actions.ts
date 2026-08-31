'use server'

import { prisma } from '@/lib/prisma'
import { getClientStats } from '@/modules/clients/clients.actions'
import { requireAuth } from '@/modules/auth/auth.actions'

export async function getDashboardStats() {
  await requireAuth()
  const [
    salesToday,
    incomeToday,
    lowStockProducts,
    clientStats,
    recentSales,
    salesByMonth,
    topProducts,
    salesByPayment,
    totalProducts,
  ] = await Promise.all([
    getSalesToday(),
    getIncomeToday(),
    getLowStockProducts(),
    getClientStats(),
    getRecentSales(),
    getSalesByMonth(12),
    getTopProducts(30),
    getSalesByPayment(),
    prisma.product.count({ where: { deletedAt: null } }),
  ])

  return {
    salesToday,
    incomeToday,
    lowStockProducts,
    clientStats,
    recentSales,
    salesByMonth,
    topProducts,
    salesByPayment,
    totalProducts,
  }
}

async function getSalesToday() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const [sales, transactions] = await Promise.all([
    prisma.sale.count({
      where: { status: 'COMPLETED', saleDate: { gte: start, lte: end } },
    }),
    prisma.sale.findMany({
      where: { status: 'COMPLETED', saleDate: { gte: start, lte: end } },
      select: { total: true },
    }),
  ])

  const total = transactions.reduce((sum, s) => sum + s.total, 0)

  return { count: sales, total }
}

async function getIncomeToday() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const income = await prisma.transaction.aggregate({
    where: { type: 'INCOME', date: { gte: start, lte: end } },
    _sum: { amount: true },
  })

  return income._sum.amount ?? 0
}

async function getLowStockProducts() {
  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    orderBy: { stock: 'asc' },
  })

  return products
    .filter((p) => p.stock <= p.lowStockThreshold)
    .slice(0, 10)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock, lowStockThreshold: p.lowStockThreshold }))
}

async function getRecentSales() {
  return await prisma.sale.findMany({
    take: 5,
    orderBy: { saleDate: 'desc' },
    where: { status: 'COMPLETED' },
    select: {
      id: true,
      invoiceNumber: true,
      total: true,
      paymentMethod: true,
      saleDate: true,
      client: {
        select: { id: true, name: true },
      },
    },
  })
}

export async function getSalesByMonth(months: number = 12) {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const sales = await prisma.sale.findMany({
    where: {
      status: 'COMPLETED',
      saleDate: { gte: startDate },
    },
    select: {
      saleDate: true,
      total: true,
    },
    orderBy: { saleDate: 'asc' },
  })

  const byMonth = sales.reduce(
    (acc, sale) => {
      const date = new Date(sale.saleDate)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, total: 0, count: 0 }
      }

      acc[monthKey].total += sale.total
      acc[monthKey].count += 1

      return acc
    },
    {} as Record<string, { month: string; total: number; count: number }>,
  )

  return Object.values(byMonth)
}

export async function getTopProducts(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const topItems = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: {
      sale: {
        status: 'COMPLETED',
        saleDate: { gte: startDate },
      },
    },
    _sum: { quantity: true, total: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 10,
  })

  const productIds = topItems.map((item) => item.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    select: { id: true, name: true },
  })

  return topItems.map((item) => ({
    ...item,
    product: products.find((p) => p.id === item.productId),
  }))
}

export async function getSalesByPayment() {
  const sales = await prisma.sale.groupBy({
    by: ['paymentMethod'],
    where: { status: 'COMPLETED' },
    _count: { id: true },
    _sum: { total: true },
    orderBy: { _sum: { total: 'desc' } },
  })

  return sales
}
