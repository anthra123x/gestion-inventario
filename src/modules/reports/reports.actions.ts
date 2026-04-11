'use server'

import { prisma } from '@/lib/prisma'
import { ReportFiltersSchema } from '@/lib/validations'
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
    include: {
      client: true,
      saleItems: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate summary
  const totalSales = sales.length
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0)
  const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0

  // Group by payment method
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

  // Top products
  const productSales = sales.flatMap(sale => sale.saleItems)
  const topProducts = productSales.reduce((acc, item) => {
    const productId = item.productId
    if (!acc[productId]) {
      acc[productId] = {
        product: item.product,
        quantity: 0,
        revenue: 0,
      }
    }
    acc[productId].quantity += item.quantity
    acc[productId].revenue += item.total
    return acc
  }, {} as Record<string, any>)

  return {
    sales,
    summary: {
      totalSales,
      totalRevenue,
      averageSale,
      paymentMethodStats,
    },
    topProducts: Object.values(topProducts).sort((a, b) => b.quantity - a.quantity),
  }
}

export async function getInventoryReport(filters?: {
  category?: ProductCategory
  lowStock?: boolean
}) {
  const where = {
    ...(filters?.category && { category: filters.category }),
    ...(filters?.lowStock && {
      stock: {
        lte: prisma.product.fields.minStock,
      },
    }),
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  // Calculate summary
  const totalProducts = products.length
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0)
  const totalValue = products.reduce((sum, product) => sum + (product.stock * product.salePrice), 0)
  const lowStockCount = products.filter(product => product.stock <= product.minStock).length
  const outOfStockCount = products.filter(product => product.stock === 0).length

  // Group by category
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
    include: {
      client: true,
      repairParts: {
        include: {
          product: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Calculate summary
  const totalRepairs = repairs.length
  const totalRevenue = repairs.reduce((sum, repair) => sum + repair.cost, 0)
  const averageRepair = totalRepairs > 0 ? totalRevenue / totalRepairs : 0

  // Group by status
  const statusStats = repairs.reduce((acc, repair) => {
    if (!acc[repair.status]) {
      acc[repair.status] = {
        count: 0,
        revenue: 0,
      }
    }
    acc[repair.status].count += 1
    acc[repair.status].revenue += repair.cost
    return acc
  }, {} as Record<RepairStatus, { count: number; revenue: number }>)

  // Group by device type
  const deviceStats = repairs.reduce((acc, repair) => {
    const device = repair.device
    if (!acc[device]) {
      acc[device] = {
        count: 0,
        revenue: 0,
      }
    }
    acc[device].count += 1
    acc[device].revenue += repair.cost
    return acc
  }, {} as Record<string, { count: number; revenue: number }>)

  return {
    repairs,
    summary: {
      totalRepairs,
      totalRevenue,
      averageRepair,
      statusStats,
    },
    deviceStats: Object.entries(deviceStats).sort((a, b) => b[1].count - a[1].count),
  }
}

export async function getClientsReport(filters?: {
  startDate?: Date
  endDate?: Date
  hasSales?: boolean
  hasRepairs?: boolean
}) {
  const clients = await prisma.client.findMany({
    include: {
      sales: {
        where: filters?.startDate && filters?.endDate ? {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        } : undefined,
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      },
      repairs: {
        where: filters?.startDate && filters?.endDate ? {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        } : undefined,
        include: {
          repairParts: {
            include: {
              product: true,
            },
          },
        },
      },
      _count: {
        select: {
          sales: true,
          repairs: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Filter clients based on criteria
  let filteredClients = clients
  if (filters?.hasSales) {
    filteredClients = filteredClients.filter(client => client.sales.length > 0)
  }
  if (filters?.hasRepairs) {
    filteredClients = filteredClients.filter(client => client.repairs.length > 0)
  }

  // Calculate client stats
  const clientStats = filteredClients.map(client => ({
    ...client,
    totalSpent: client.sales.reduce((sum, sale) => sum + sale.total, 0),
    totalRepairsCost: client.repairs.reduce((sum, repair) => sum + repair.cost, 0),
    totalTransactions: client.sales.length + client.repairs.length,
  }))

  // Sort by total spent
  clientStats.sort((a, b) => b.totalSpent - a.totalSpent)

  // Calculate summary
  const totalClients = clientStats.length
  const totalSpent = clientStats.reduce((sum, client) => sum + client.totalSpent, 0)
  const averageSpent = totalClients > 0 ? totalSpent / totalClients : 0
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
