'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/modules/auth/auth.actions'
import { CreateNotificationSchema } from '@/lib/validations'
import { getZodErrorMessage } from '@/lib/zod-error'
import type { NotificationType } from '@prisma/client'

export async function createNotification(data: {
  userId?: string | null
  type: NotificationType
  title: string
  message?: string | null
  entityType?: string | null
  entityId?: string | null
}) {
  try {
    const parsed = CreateNotificationSchema.parse(data)
    await prisma.notification.create({ data: parsed })
  } catch {
    // Notification failures should never break the main operation
  }
}

export async function notifyUsers(
  type: NotificationType,
  title: string,
  message?: string | null,
  entityType?: string | null,
  entityId?: string | null,
) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true },
      where: { role: { in: ['ADMIN', 'EMPLOYEE'] } },
    })

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type,
        title,
        message: message || null,
        entityType: entityType || null,
        entityId: entityId || null,
      })),
    })
  } catch {
    // Notification failures should never break the main operation
  }
}

export async function getNotifications(page = 1, take = 20) {
  try {
    const user = await getCurrentUser()
    if (!user) return { notifications: [], total: 0, page, totalPages: 0 }

    const where = { userId: user.id }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * take,
        take,
      }),
      prisma.notification.count({ where }),
    ])

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / take),
    }
  } catch {
    return { notifications: [], total: 0, page: 1, totalPages: 0 }
  }
}

export async function getUnreadCount() {
  try {
    const user = await getCurrentUser()
    if (!user) return 0

    return await prisma.notification.count({
      where: { userId: user.id, read: false },
    })
  } catch {
    return 0
  }
}

export async function markAsRead(id: string) {
  try {
    const user = await getCurrentUser()
    if (!user) return

    await prisma.notification.updateMany({
      where: { id, userId: user.id },
      data: { read: true },
    })
  } catch {
    // silent
  }
}

export async function markAllAsRead() {
  try {
    const user = await getCurrentUser()
    if (!user) return

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    })
  } catch {
    // silent
  }
}
