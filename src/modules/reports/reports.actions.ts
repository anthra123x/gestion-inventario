'use server'

import { prisma } from '@/lib/prisma'
import type { RepairStatus } from '@prisma/client'
import { requireAuth } from '@/modules/auth/auth.actions'

export async function getRepairsReport(filters?: {
  startDate?: Date
  endDate?: Date
  status?: RepairStatus
  clientId?: string
}) {
  await requireAuth()
  const where = {
    ...(filters?.startDate &&
      filters?.endDate && {
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
      laborCost: true,
      createdAt: true,
      estimatedDate: true,
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
          part: {
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
  const partsCostSum = repairs.reduce(
    (sum, r) => sum + r.repairParts.reduce((ps, p) => ps + p.total, 0),
    0,
  )
  const totalLabor = repairs.reduce((sum, r) => sum + r.laborCost, 0)
  const totalRevenue = partsCostSum + totalLabor
  const averageRepair = totalRepairs > 0 ? totalRevenue / totalRepairs : 0

  const statusStats = repairs.reduce(
    (acc, repair) => {
      if (!acc[repair.status]) {
        acc[repair.status] = {
          count: 0,
          revenue: 0,
          partsCost: 0,
          laborCost: 0,
        }
      }
      acc[repair.status].count += 1
      const pc = repair.repairParts.reduce((s, p) => s + p.total, 0)
      acc[repair.status].partsCost += pc
      acc[repair.status].laborCost += repair.laborCost
      acc[repair.status].revenue += pc + repair.laborCost
      return acc
    },
    {} as Record<string, { count: number; revenue: number; partsCost: number; laborCost: number }>,
  )

  const deviceStats = repairs.reduce(
    (acc, repair) => {
      const device = repair.device
      if (!acc[device]) {
        acc[device] = {
          count: 0,
          revenue: 0,
        }
      }
      acc[device].count += 1
      acc[device].revenue += repair.repairParts.reduce((s, p) => s + p.total, 0) + repair.laborCost
      return acc
    },
    {} as Record<string, { count: number; revenue: number }>,
  )

  return {
    repairs,
    summary: {
      totalRepairs,
      totalRevenue,
      totalPartsCost: partsCostSum,
      totalLabor,
      averageRepair,
      statusStats,
    },
    deviceStats: Object.entries(deviceStats).sort((a, b) => b[1].revenue - a[1].revenue),
  }
}

export async function getClientsReport(filters?: {
  startDate?: Date
  endDate?: Date
  hasRepairs?: boolean
}) {
  await requireAuth()
  const dateFilter =
    filters?.startDate && filters?.endDate
      ? {
          createdAt: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }
      : undefined

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
          repairs: true,
        },
      },
      repairs: {
        where: dateFilter,
        select: {
          id: true,
          laborCost: true,
          repairParts: {
            select: {
              total: true,
            },
          },
          createdAt: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  let filteredClients = clients
  if (filters?.hasRepairs) {
    filteredClients = filteredClients.filter((client) => client.repairs.length > 0)
  }

  const clientStats = filteredClients.map((client) => {
    const partsCost = client.repairs.reduce(
      (sum, r) => sum + r.repairParts.reduce((ps, p) => ps + p.total, 0),
      0,
    )
    const totalLabor = client.repairs.reduce((sum, r) => sum + r.laborCost, 0)
    const totalSpent = partsCost + totalLabor

    return {
      ...client,
      totalSpent,
      totalLabor,
      totalPartsCost: partsCost,
      totalTransactions: client.repairs.length,
    }
  })

  clientStats.sort((a, b) => b.totalSpent - a.totalSpent)

  const totalClients = clientStats.length
  const totalSpent = clientStats.reduce((sum, c) => sum + c.totalSpent, 0)
  const averageSpent = totalClients > 0 ? totalSpent / totalClients : 0
  const newClients =
    filters?.startDate && filters?.endDate
      ? clientStats.filter((c) => c.createdAt >= filters.startDate! && c.createdAt <= filters.endDate!)
          .length
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
  status?: string
}

export async function generateReportData(reportType: string, filters: ReportFilters) {
  await requireAuth()
  switch (reportType) {
    case 'repairs':
      return await getRepairsReport({
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status as RepairStatus | undefined,
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
