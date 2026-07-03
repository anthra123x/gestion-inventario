'use server'

import { prisma } from '@/lib/prisma'
import { getRepairStats } from '@/modules/repairs/repairs.actions'
import { getClientStats } from '@/modules/clients/clients.actions'
import { requireAuth } from '@/modules/auth/auth.actions'

export async function getDashboardStats() {
  await requireAuth()
  const [
    repairStats,
    clientStats,
    recentRepairs,
    repairsReady,
  ] = await Promise.all([
    getRepairStats(),
    getClientStats(),
    getRecentRepairs(),
    getRepairsReadyCount(),
  ])

  return {
    repairStats,
    clientStats,
    recentRepairs,
    repairsReady,
  }
}

async function getRepairsReadyCount() {
  const count = await prisma.repair.count({
    where: { status: 'READY' },
  })
  return count
}

async function getRecentRepairs() {
  return await prisma.repair.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      device: true,
      status: true,
      laborCost: true,
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

export async function getRepairsByStatus() {
  const repairs = await prisma.repair.groupBy({
    by: ['status'],
    _count: {
      id: true,
    },
  })

  return repairs
}

export async function getRepairsByMonth(months: number = 12) {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const repairs = await prisma.repair.findMany({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
    select: {
      createdAt: true,
      laborCost: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const repairsByMonth = repairs.reduce(
    (acc, repair) => {
      const date = new Date(repair.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthKey,
          totalLabor: 0,
          count: 0,
        }
      }

      acc[monthKey].totalLabor += repair.laborCost
      acc[monthKey].count += 1

      return acc
    },
    {} as Record<string, { month: string; totalLabor: number; count: number }>,
  )

  return Object.values(repairsByMonth)
}

export async function getTopParts(days: number = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const topParts = await prisma.repairPart.groupBy({
    by: ['partId'],
    where: {
      repair: {
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

  const partIds = topParts.map((item) => item.partId)
  const parts = await prisma.part.findMany({
    where: {
      id: {
        in: partIds,
      },
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  })

  return topParts.map((item) => ({
    ...item,
    part: parts.find((p) => p.id === item.partId),
  }))
}
