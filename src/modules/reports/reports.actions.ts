'use server'

import { prisma } from '@/lib/prisma'
import { ProductCategory, RepairStatus, PaymentMethod } from '@prisma/client'

export async function getSalesReport(filters?: {
  startDate?: Date
  endDate?: Date
  clientId?: string
}) {
  const where = {
    ...(filters?.startDate && filters?.endDate && {
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    }),
    ...(filters?.clientId && {
      clientId: filters.clientId,
    }),
  }

  const sales = await prisma.sale.findMany({
    where,
    select: {
      id: true,
      total: true,
      discountPercent: true,
      discountAmount: true,
      paymentMethod: true,
      notes: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      saleItems: {
        select: {
          id: true,
          quantity: true,
          unitPrice: true,
          total: true,
          purchasePriceAtSale: true,
          profit: true,
          productId: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const totalCost = sales.reduce((sum, sale) =>
    sum + sale.saleItems.reduce((itemSum, item) => itemSum + (item.purchasePriceAtSale * item.quantity), 0)
  , 0)
  const totalProfit = sales.reduce((sum, sale) =>
    sum + sale.saleItems.reduce((itemSum, item) => itemSum + (item.profit || 0), 0)
  , 0)
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const paymentMethodStats = sales.reduce((acc, sale) => {
    if (!acc[sale.paymentMethod]) {
      acc[sale.paymentMethod] = {
        count: 0,
        total: 0,
      }
    }
    acc[sale.paymentMethod].count += 1
    acc[sale.paymentMethod].total += sale.total
    return acc
  }, {} as Record<PaymentMethod, { count: number; total: number }>)

  const productSales = sales.flatMap(sale => sale.saleItems)
  const topProducts = productSales.reduce((acc, item) => {
    const productId = item.productId
    if (!acc[productId]) {
      acc[productId] = {
        product: item.product,
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      }
    }
    acc[productId].quantity += item.quantity
    acc[productId].revenue += item.total
    acc[productId].cost += item.purchasePriceAtSale * item.quantity
    acc[productId].profit += item.profit || 0
    return acc
  }, {} as Record<string, any>)

  return {
    sales,
    summary: {
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      averageSale,
      paymentMethodStats,
    },
    topProducts: Object.values(topProducts).sort((a, b) => b.revenue - a.revenue),
  }
}

export async function getInventoryReport(filters?: {
  category?: ProductCategory
  lowStock?: boolean
}) {
  const where = {
    deletedAt: null,
    ...(filters?.category && { category: filters.category }),
  }

  let products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  if (filters?.lowStock) {
    products = products.filter(p => p.stock <= p.minStock)
  }

  const totalProducts = products.length
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const totalValue = products.reduce((sum, product) => sum + (product.stock * product.salePrice), 0)
  const totalCostValue = products.reduce((sum, product) => sum + (product.stock * product.purchasePrice), 0)
  const inStockCount = products.filter(product => product.stock > product.minStock).length
  const lowStockCount = products.filter(product => product.stock > 0 && product.stock <= product.minStock).length
  const outOfStockCount = products.filter(product => product.stock === 0).length

  const categoryStats = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = {
        count: 0,
        stock: 0,
        value: 0,
      }
    }
    acc[product.category].count += 1
    acc[product.category].stock += product.stock
    acc[product.category].value += product.stock * product.salePrice
    return acc
  }, {} as Record<ProductCategory, { count: number; stock: number; value: number }>)

  return {
    products,
    summary: {
      totalProducts,
      totalStock,
      totalValue,
      totalCostValue,
      inStockCount,
      lowStockCount,
      outOfStockCount,
    },
    categoryStats,
  }
}

export async function getRepairsReport(filters?: {
  startDate?: Date
  endDate?: Date
  status?: RepairStatus
  clientId?: string
}) {
  const where = {
    ...(filters?.startDate && filters?.endDate && {
      createdAt: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.clientId && { clientId: filters.clientId }),
  }

  const repairs = await prisma.repair.findMany({
    where,
    select: {
      id: true,
      device: true,
      problem: true,
      diagnosis: true,
      status: true,
      cost: true,
      partsCost: true,
      profit: true,
      createdAt: true,
      dateDelivered: true,
      client: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
      repairParts: {
        select: {
          id: true,
          quantity: true,
          unitCost: true,
          total: true,
          purchasePriceAtPart: true,
          product: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalRepairs = repairs.length
  const totalRevenue = repairs.reduce((sum, repair) => sum + repair.cost, 0)
  const totalPartsCost = repairs.reduce((sum, repair) => sum + (repair.partsCost || 0), 0)
  const totalProfit = repairs.reduce((sum, repair) => sum + (repair.profit || 0), 0)
  const averageRepair = totalRepairs > 0 ? totalRevenue / totalRepairs : 0
  const avgProfit = totalRepairs > 0 ? totalProfit / totalRepairs : 0

  const statusStats = repairs.reduce((acc, repair) => {
    if (!acc[repair.status]) {
      acc[repair.status] = {
        count: 0,
        revenue: 0,
        profit: 0,
      }
    }
    acc[repair.status].count += 1
    acc[repair.status].revenue += repair.cost
    acc[repair.status].profit += repair.profit || 0
    return acc
  }, {} as Record<RepairStatus, { count: number; revenue: number; profit: number }>)

  const deviceStats = repairs.reduce((acc, repair) => {
    const device = repair.device
    if (!acc[device]) {
      acc[device] = {
        count: 0,
        revenue: 0,
        profit: 0,
      }
    }
    acc[device].count += 1
    acc[device].revenue += repair.cost
    acc[device].profit += repair.profit || 0
    return acc
  }, {} as Record<string, { count: number; revenue: number; profit: number }>)

  const mostProfitable = repairs.length > 0
    ? repairs.reduce((max, repair) => (repair.profit || 0) > (max.profit || 0) ? repair : max, repairs[0])
    : null

  return {
    repairs,
    summary: {
      totalRepairs,
      totalRevenue,
      totalPartsCost,
      totalProfit,
      averageRepair,
      avgProfit,
      statusStats,
      mostProfitable,
    },
    deviceStats: Object.entries(deviceStats).sort((a, b) => b[1].revenue - a[1].revenue),
  }
}

export async function getClientsReport(filters?: {
  startDate?: Date
  endDate?: Date
  hasSales?: boolean
  hasRepairs?: boolean
}) {
  const dateFilter = filters?.startDate && filters?.endDate ? {
    createdAt: {
      gte: filters.startDate,
      lte: filters.endDate,
    },
  } : undefined

  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
      createdAt: true,
      _count: {
        select: {
          sales: true,
          repairs: true,
        },
      },
      sales: {
        where: dateFilter,
        select: {
          id: true,
          total: true,
          createdAt: true,
        },
      },
      repairs: {
        where: dateFilter,
        select: {
          id: true,
          cost: true,
          profit: true,
          createdAt: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  let filteredClients = clients
  if (filters?.hasSales) {
    filteredClients = filteredClients.filter(client => client.sales.length > 0)
  }
  if (filters?.hasRepairs) {
    filteredClients = filteredClients.filter(client => client.repairs.length > 0)
  }

  const saleIds = filteredClients.flatMap(c => c.sales.map(s => s.id))
  const salesProfitMap: Record<string, number> = {}
  if (saleIds.length > 0) {
    const saleProfits = await prisma.saleItem.groupBy({
      by: ['saleId'],
      where: { saleId: { in: saleIds } },
      _sum: { profit: true },
    })
    for (const sp of saleProfits) {
      salesProfitMap[sp.saleId] = sp._sum.profit || 0
    }
  }

  const clientSalesProfitMap: Record<string, number> = {}
  for (const c of filteredClients) {
    let totalProfit = 0
    for (const s of c.sales) {
      totalProfit += salesProfitMap[s.id] || 0
    }
    clientSalesProfitMap[c.id] = totalProfit
  }

  const clientStats = filteredClients.map(client => {
    const totalSalesSpent = client.sales.reduce((sum, sale) => sum + sale.total, 0)
    const totalRepairsCost = client.repairs.reduce((sum, repair) => sum + repair.cost, 0)
    const totalRepairsProfit = client.repairs.reduce((sum, repair) => sum + (repair.profit || 0), 0)

    return {
      ...client,
      totalSpent: totalSalesSpent,
      totalSalesProfit: clientSalesProfitMap[client.id] || 0,
      totalRepairsCost,
      totalRepairsProfit,
      totalTransactions: client.sales.length + client.repairs.length,
    }
  })

  clientStats.sort((a, b) => b.totalSpent - a.totalSpent)

  const totalClients = clientStats.length
  const totalSpent = clientStats.reduce((sum, client) => sum + client.totalSpent, 0)
  const averageSpent = totalClients > 0 ? totalSpent / totalClients : 0
  const totalProfit = clientStats.reduce((sum, client) => sum + (client.totalSalesProfit || 0) + (client.totalRepairsProfit || 0), 0)
  const newClients = filters?.startDate && filters?.endDate
    ? clientStats.filter(client =>
        client.createdAt >= filters.startDate! && client.createdAt <= filters.endDate!
      ).length
    : 0

  return {
    clients: clientStats,
    summary: {
      totalClients,
      totalSpent,
      totalProfit,
      averageSpent,
      newClients,
    },
  }
}

interface ReportFilters {
  startDate?: Date
  endDate?: Date
  category?: string
  status?: string
}

export async function generateReportData(reportType: string, filters: ReportFilters) {
  switch (reportType) {
    case 'sales':
      return await getSalesReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    case 'inventory':
      return await getInventoryReport({
        category: filters.category as any,
        lowStock: false,
      })
    case 'repairs':
      return await getRepairsReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status as any,
        clientId: undefined,
      })
    case 'clients':
      return await getClientsReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
      })
    default:
      throw new Error('Tipo de reporte no válido')
  }
}
