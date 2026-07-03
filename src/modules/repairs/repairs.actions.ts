'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateRepairSchema, UpdateRepairSchema, EditRepairSchema } from '@/lib/validations'
import { RepairStatus } from '@prisma/client'
import { requireAuth } from '@/modules/auth/auth.actions'
import { parseError } from '@/lib/errors'
import { notifyUsers } from '@/modules/notifications/notifications.actions'

export async function getRepairs(search?: string, status?: RepairStatus, page = 1, take = 20) {
  await requireAuth()
  const where = {
    ...(search && {
      OR: [
        { client: { name: { contains: search, mode: 'insensitive' as const } } },
        { client: { phone: { contains: search, mode: 'insensitive' as const } } },
        { device: { contains: search, mode: 'insensitive' as const } },
        { problem: { contains: search, mode: 'insensitive' as const } },
        { notes: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(status && { status }),
  }

  const [repairs, total] = await Promise.all([
    prisma.repair.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        device: true,
        problem: true,
        diagnosis: true,
        status: true,
        laborCost: true,
        notes: true,
        estimatedDate: true,
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
            name: true,
          },
        },
        repairParts: {
          select: { total: true },
        },
        _count: {
          select: {
            repairParts: true,
          },
        },
      },
    }),
    prisma.repair.count({ where }),
  ])

  return {
    repairs,
    total,
    page,
    totalPages: Math.ceil(total / take),
  }
}

export async function getRepairById(id: string) {
  await requireAuth()
  return await prisma.repair.findUnique({
    where: { id },
    include: {
      client: true,
      repairParts: {
        include: {
          part: true,
        },
      },
      user: {
        select: {
          name: true,
        },
      },
    },
  })
}

export async function createRepair(formData: FormData) {
  await requireAuth()
  const partsJson = formData.get('parts') as string

  let rawParts: { partId: string; quantity: number; unitCost: number }[]
  try {
    rawParts = partsJson ? JSON.parse(partsJson) : []
  } catch {
    return {
      error: 'Datos de repuestos inválidos',
    }
  }

  const parts = rawParts.map((part) => ({
    partId: part.partId,
    quantity: isNaN(Number(part.quantity)) ? 1 : Number(part.quantity),
    unitCost: isNaN(Number(part.unitCost)) ? 0 : Number(part.unitCost),
  }))

  const clientName = (formData.get('clientName') as string) || 'Cliente'
  const clientPhone = formData.get('clientPhone') as string | null
  const clientEmail = formData.get('clientEmail') as string
  const clientAddress = formData.get('clientAddress') as string

  const finalPhone = clientPhone?.trim() || null

  let clientId: string

  try {
    clientId = await prisma.$transaction(async (tx) => {
      if (finalPhone) {
        const existingClient = await tx.client.findFirst({
          where: { phone: finalPhone, deletedAt: null },
        })

        if (existingClient) {
          return existingClient.id
        }
      }

      const newClient = await tx.client.create({
        data: {
          name: clientName,
          phone: finalPhone,
          email: clientEmail || null,
          address: clientAddress || null,
        },
      })

      return newClient.id
    })
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error al procesar el cliente',
    }
  }

  const laborCostValue = parseFloat(formData.get('laborCost') as string)

  const validatedFields = CreateRepairSchema.safeParse({
    clientId: clientId,
    device: formData.get('device'),
    problem: formData.get('problem'),
    diagnosis: formData.get('diagnosis') || null,
    laborCost: isNaN(laborCostValue) ? 0 : laborCostValue,
    notes: formData.get('clientNotes') || null,
    internalNotes: formData.get('internalNotes') || null,
    estimatedDate: (formData.get('estimatedDate') as string) || null,
    parts,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const { clientId, device, problem, diagnosis, laborCost, notes, internalNotes, estimatedDate, parts } =
      validatedFields.data


    const repair = await prisma.repair.create({
      data: {
        clientId,
        device,
        problem,
        diagnosis,
        laborCost,
        notes,
        internalNotes,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
        repairParts:
          parts && parts.length > 0
            ? {
                create: parts.map((part) => ({
                  partId: part.partId,
                  quantity: part.quantity,
                  unitCost: part.unitCost,
                  total: part.unitCost * part.quantity,
                })),
              }
            : undefined,
      },
      include: {
        repairParts: {
          include: {
            part: true,
          },
        },
      },
    })

    revalidatePath('/repairs')
    revalidatePath('/dashboard')
    return {
      success: 'Reparación creada exitosamente',
      repair,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function updateRepair(id: string, formData: FormData) {
  await requireAuth()

  const validatedFields = UpdateRepairSchema.safeParse({
    status: formData.get('status') as RepairStatus,
    diagnosis: formData.get('diagnosis') || null,
    laborCost: formData.get('laborCost') ? parseFloat(formData.get('laborCost') as string) : undefined,
    notes: formData.get('notes') || null,
    internalNotes: formData.get('internalNotes') || null,
    estimatedDate: formData.get('estimatedDate') ? String(formData.get('estimatedDate')) : undefined,
    dateDelivered: formData.get('dateDelivered') ? String(formData.get('dateDelivered')) : undefined,
  })

  if (!validatedFields.success) {
    return {
      error: 'Datos inválidos',
    }
  }

  try {
    const repair = await prisma.repair.update({
      where: { id },
      data: validatedFields.data,
    })

    const newStatus = validatedFields.data.status
    if (newStatus === 'READY') {
      notifyUsers('REPAIR_READY', 'Reparación lista', `Reparación #${id.slice(-6)} lista para entregar`, 'repair', id)
    } else if (newStatus === 'DELIVERED') {
      notifyUsers('REPAIR_READY', 'Reparación entregada', `Reparación #${id.slice(-6)} entregada al cliente`, 'repair', id)
    }

    revalidatePath('/repairs')
    revalidatePath(`/repairs/${id}`)
    return {
      success: 'Reparación actualizada exitosamente',
      repair,
    }
  } catch {
    return {
      error: 'Error al actualizar la reparación',
    }
  }
}

export async function editRepair(id: string, formData: FormData) {
  await requireAuth()
  const partsJson = formData.get('parts') as string

  let rawParts: { partId: string; quantity: number; unitCost: number }[]
  try {
    rawParts = partsJson ? JSON.parse(partsJson) : []
  } catch {
    return { error: 'Datos de repuestos inválidos' }
  }

  const parts = rawParts.map((part) => ({
    partId: part.partId,
    quantity: isNaN(Number(part.quantity)) ? 1 : Number(part.quantity),
    unitCost: isNaN(Number(part.unitCost)) ? 0 : Number(part.unitCost),
  }))

  const clientName = formData.get('clientName') as string | null
  const clientPhone = formData.get('clientPhone') as string | null
  const clientEmail = formData.get('clientEmail') as string
  const clientAddress = formData.get('clientAddress') as string

  const finalPhone = clientPhone?.trim() || null

  const laborCostValue = parseFloat(formData.get('laborCost') as string)
  const statusValue = formData.get('status') as RepairStatus | null

  const validatedFields = EditRepairSchema.safeParse({
    clientName: clientName || undefined,
    clientPhone: finalPhone,
    clientEmail: clientEmail || null,
    clientAddress: clientAddress || null,
    device: formData.get('device'),
    problem: formData.get('problem'),
    diagnosis: formData.get('diagnosis') || null,
    laborCost: isNaN(laborCostValue) ? 0 : laborCostValue,
    notes: formData.get('notes') || null,
    internalNotes: formData.get('internalNotes') || null,
    estimatedDate: (formData.get('estimatedDate') as string) || null,
    status: statusValue || undefined,
    parts,
  })

  if (!validatedFields.success) {
    return { error: validatedFields.error.issues.map((e) => e.message).join(', ') }
  }

  try {
    const existingRepair = await prisma.repair.findUnique({
      where: { id },
      include: {
        repairParts: true,
        client: true,
      },
    })

    if (!existingRepair) {
      return { error: 'Reparación no encontrada' }
    }

    const {
      clientName,
      clientEmail,
      clientAddress,
      device,
      problem,
      diagnosis,
      laborCost,
      notes,
      internalNotes,
      estimatedDate,
      status,
      parts,
    } = validatedFields.data

    await prisma.$transaction(async (tx) => {
      const clientUpdateData: Record<string, unknown> = {}
      if (clientName) clientUpdateData.name = clientName
      if (finalPhone !== undefined) clientUpdateData.phone = finalPhone
      clientUpdateData.email = clientEmail || null
      clientUpdateData.address = clientAddress || null

      if (finalPhone !== existingRepair.client.phone) {
        if (finalPhone) {
          const existingClient = await tx.client.findFirst({
            where: { phone: finalPhone, id: { not: existingRepair.clientId } },
          })
          if (existingClient) {
            await tx.repair.update({
              where: { id },
              data: { clientId: existingClient.id },
            })
          } else {
            await tx.client.update({
              where: { id: existingRepair.clientId },
              data: clientUpdateData,
            })
          }
        } else {
          await tx.client.update({
            where: { id: existingRepair.clientId },
            data: { ...clientUpdateData, phone: null },
          })
        }
      } else {
        await tx.client.update({
          where: { id: existingRepair.clientId },
          data: clientUpdateData,
        })
      }

      await tx.repairPart.deleteMany({
        where: { repairId: id },
      })

      const updateData: Record<string, unknown> = {
        device,
        problem,
        diagnosis,
        laborCost,
        notes,
        internalNotes,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
      }

      if (status) {
        updateData.status = status
        if (status === 'DELIVERED') {
          updateData.dateDelivered = new Date()
        }
      }

      await tx.repair.update({
        where: { id },
        data: updateData,
      })

      if (parts && parts.length > 0) {
        await tx.repairPart.createMany({
          data: parts.map((part) => ({
            repairId: id,
            partId: part.partId,
            quantity: part.quantity,
            unitCost: part.unitCost,
            total: part.unitCost * part.quantity,
          })),
        })
      }
    })

    if (status === 'READY') {
      notifyUsers('REPAIR_READY', 'Reparación lista', `Reparación #${id.slice(-6)} lista para entregar`, 'repair', id)
    } else if (status === 'DELIVERED') {
      notifyUsers('REPAIR_READY', 'Reparación entregada', `Reparación #${id.slice(-6)} entregada al cliente`, 'repair', id)
    }

    revalidatePath('/repairs')
    revalidatePath(`/repairs/${id}`)
    revalidatePath('/dashboard')
    return { success: 'Reparación actualizada exitosamente' }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function deleteRepair(id: string) {
  await requireAuth()

  try {
    await prisma.repair.delete({
      where: { id },
    })

    revalidatePath('/repairs')
    return {
      success: 'Reparación eliminada exitosamente',
    }
  } catch {
    return {
      error: 'Error al eliminar la reparación',
    }
  }
}

export async function getRepairStats() {
  await requireAuth()
  const [totalRepairs, activeRepairs, completedRepairs, repairsByStatus, laborData] = await Promise.all([
    prisma.repair.count(),
    prisma.repair.count({
      where: {
        status: {
          in: ['RECEIVED', 'IN_PROGRESS'],
        },
      },
    }),
    prisma.repair.count({
      where: {
        status: 'DELIVERED',
      },
    }),
    prisma.repair.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    }),
    prisma.repair.aggregate({
      _sum: {
        laborCost: true,
      },
      _avg: {
        laborCost: true,
      },
    }),
  ])

  return {
    totalRepairs,
    activeRepairs,
    completedRepairs,
    repairsByStatus,
    totalLabor: laborData._sum.laborCost || 0,
    avgLabor: laborData._avg.laborCost || 0,
  }
}

export async function getRepairsByDevice() {
  await requireAuth()
  const repairs = await prisma.repair.groupBy({
    by: ['device'],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: 10,
  })

  return repairs
}

export async function updateRepairStatus(id: string, status: RepairStatus) {
  await requireAuth()

  try {
    const updateData: { status: RepairStatus; dateDelivered?: Date } = { status }

    if (status === 'DELIVERED') {
      updateData.dateDelivered = new Date()
    }

    const repair = await prisma.repair.update({
      where: { id },
      data: updateData,
    })

    if (status === 'READY') {
      notifyUsers('REPAIR_READY', 'Reparación lista', `Reparación #${id.slice(-6)} lista para entregar`, 'repair', id)
    } else if (status === 'DELIVERED') {
      notifyUsers('REPAIR_READY', 'Reparación entregada', `Reparación #${id.slice(-6)} entregada al cliente`, 'repair', id)
    }

    revalidatePath('/repairs')
    revalidatePath(`/repairs/${id}`)
    return {
      success: 'Estado actualizado exitosamente',
      repair,
    }
  } catch {
    return {
      error: 'Error al actualizar el estado',
    }
  }
}
