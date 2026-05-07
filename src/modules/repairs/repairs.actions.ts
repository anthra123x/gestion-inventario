'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateRepairSchema, UpdateRepairSchema } from '@/lib/validations'
import { checkStockAvailability } from '@/lib/stock-check'
import { getZodErrorMessage } from '@/lib/zod-error'
import { validateRepairPartData, validateNonNegative } from '@/lib/validations-data'
import { RepairStatus } from '@prisma/client'

export async function getRepairs(search?: string, status?: RepairStatus) {
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

  return await prisma.repair.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      device: true,
      problem: true,
      diagnosis: true,
      status: true,
      cost: true,
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
    },
  })
}

export async function getRepairById(id: string) {
  return await prisma.repair.findUnique({
    where: { id },
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
  })
}

export async function createRepair(formData: FormData) {
  const partsJson = formData.get('parts') as string

  let rawParts: any[]
  try {
    rawParts = partsJson ? JSON.parse(partsJson) : []
  } catch {
    return {
      error: 'Datos de repuestos inválidos',
    }
  }

  // Normalizar parts para evitar NaN
  const parts = rawParts.map((part: any) => ({
    productId: part.productId,
    quantity: isNaN(Number(part.quantity)) ? 1 : Number(part.quantity),
    unitCost: isNaN(Number(part.unitCost)) ? 0 : Number(part.unitCost),
  }))

  const clientName = formData.get('clientName') as string
  const clientPhone = formData.get('clientPhone') as string
  const clientEmail = formData.get('clientEmail') as string
  const clientAddress = formData.get('clientAddress') as string

  // Always create or find client by phone
  let finalClientId: string

  // Check if client already exists by phone
  const existingClient = await prisma.client.findUnique({
    where: { phone: clientPhone },
  })

  if (existingClient) {
    finalClientId = existingClient.id
  } else {
    // Create new client
    const newClient = await prisma.client.create({
      data: {
        name: clientName,
        phone: clientPhone,
        email: clientEmail || null,
        address: clientAddress || null,
      },
    })
    finalClientId = newClient.id
  }

  const costValue = parseFloat(formData.get('cost') as string)

  const validatedFields = CreateRepairSchema.safeParse({
    clientId: finalClientId,
    device: formData.get('device'),
    problem: formData.get('problem'),
    diagnosis: formData.get('diagnosis') || null,
    cost: isNaN(costValue) ? 0 : costValue,
    notes: formData.get('clientNotes') || null,
    internalNotes: formData.get('internalNotes') || null,
    estimatedDate: formData.get('estimatedDate') as string || null,
    parts,
  })

  if (!validatedFields.success) {
    return {
      error: getZodErrorMessage(validatedFields),
    }
  }

  // Validate business logic
  try {
    validateNonNegative(validatedFields.data.cost, 'Costo')
    if (validatedFields.data.parts && validatedFields.data.parts.length > 0) {
      for (const part of validatedFields.data.parts) {
        validateRepairPartData({
          quantity: part.quantity,
          unitCost: part.unitCost,
          total: part.unitCost * part.quantity,
        })
      }
    }
  } catch (validationError: any) {
    return {
      error: validationError.message,
    }
  }

  try {
    const { clientId, device, problem, diagnosis, cost, notes, internalNotes, estimatedDate, parts } = validatedFields.data

    // Calculate parts total (what customer pays for parts)
    const partsTotal = (parts || []).reduce((sum, part) => sum + (part.unitCost * part.quantity), 0)
    const total = cost + partsTotal

    // Fetch purchase prices for profit calculation
    const partsCostMap: Record<string, number> = {}
    if (parts && parts.length > 0) {
      const products = await prisma.product.findMany({
        where: {
          id: {
            in: parts.map(p => p.productId),
          },
        },
        select: {
          id: true,
          purchasePrice: true,
        },
      })

      for (const product of products) {
        partsCostMap[product.id] = product.purchasePrice
      }
    }

    // Calculate actual parts cost (what business paid)
    const partsCost = (parts || []).reduce(
      (sum, part) => sum + ((partsCostMap[part.productId] || 0) * part.quantity),
      0
    )

    // Validate: no losses allowed
    if (cost < partsCost) {
      return {
        error: `El costo estimado (${cost}) es menor al costo de los repuestos (${partsCost}). No se permiten reparaciones con pérdida.`,
      }
    }

    const profit = cost - partsCost

    // Use transaction for atomicity
    const repair = await prisma.$transaction(async (tx) => {
      // Check stock availability for parts
      if (parts && parts.length > 0) {
        await checkStockAvailability(tx, parts.map(part => ({
          productId: part.productId,
          quantity: part.quantity,
        })))
      }

      // Create repair with profit tracking
      const newRepair = await tx.repair.create({
        data: {
          clientId,
          device,
          problem,
          diagnosis,
          cost: total,
          partsCost,
          profit,
          notes,
          internalNotes,
          estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
          repairParts: parts && parts.length > 0 ? {
            create: parts.map(part => ({
              productId: part.productId,
              quantity: part.quantity,
              unitCost: part.unitCost,
              total: part.unitCost * part.quantity,
              purchasePriceAtPart: partsCostMap[part.productId] || 0,
            })),
          } : undefined,
        },
        include: {
          repairParts: {
            include: {
              product: true,
            },
          },
        },
      })

      // Update stock and create inventory movements for parts
      if (parts && parts.length > 0) {
        for (const part of parts) {
          // Update product stock
          await tx.product.update({
            where: { id: part.productId },
            data: {
              stock: {
                decrement: part.quantity,
              },
            },
          })

          // Create inventory movement
          await tx.inventoryMovement.create({
            data: {
              productId: part.productId,
              type: 'EXIT',
              quantity: part.quantity,
              reason: `Reparación #${newRepair.id}`,
              referenceId: newRepair.id,
              referenceType: 'repair',
            },
          })
        }
      }

      return newRepair
    })

    revalidatePath('/repairs')
    revalidatePath('/dashboard')
    return {
      success: 'Reparación creada exitosamente',
      repair,
    }
  } catch (error: any) {
    return {
      error: error.message || 'Error al crear la reparación',
    }
  }
}

export async function updateRepair(id: string, formData: FormData) {

  const validatedFields = UpdateRepairSchema.safeParse({
    status: formData.get('status') as RepairStatus,
    diagnosis: formData.get('diagnosis') || null,
    cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : undefined,
    notes: formData.get('notes') || null,
    internalNotes: formData.get('internalNotes') || null,
    estimatedDate: formData.get('estimatedDate') ? new Date(formData.get('estimatedDate') as string) : undefined,
    dateDelivered: formData.get('dateDelivered') ? new Date(formData.get('dateDelivered') as string) : undefined,
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

    revalidatePath('/repairs')
    revalidatePath(`/repairs/${id}`)
    return {
      success: 'Reparación actualizada exitosamente',
      repair,
    }
  } catch (error) {
    return {
      error: 'Error al actualizar la reparación',
    }
  }
}

export async function deleteRepair(id: string) {

  try {
    // Get repair with parts to restore stock
    const repair = await prisma.repair.findUnique({
      where: { id },
      include: {
        repairParts: true,
      },
    })

    if (!repair) {
      return {
        error: 'Reparación no encontrada',
      }
    }

    // Atomic transaction: restore stock + movements + delete
    await prisma.$transaction(async (tx) => {
      // Restore stock for parts
      for (const part of repair.repairParts) {
        await tx.product.update({
          where: { id: part.productId },
          data: {
            stock: {
              increment: part.quantity,
            },
          },
        })

        await tx.inventoryMovement.create({
          data: {
            productId: part.productId,
            type: 'ENTRY',
            quantity: part.quantity,
            reason: `Cancelación reparación #${repair.id}`,
            referenceId: repair.id,
            referenceType: 'repair',
          },
        })
      }

      // Delete repair (cascade deletes repair parts)
      await tx.repair.delete({
        where: { id },
      })
    })

    revalidatePath('/repairs')
    return {
      success: 'Reparación eliminada exitosamente',
    }
  } catch (error) {
    return {
      error: 'Error al eliminar la reparación',
    }
  }
}

export async function getRepairStats() {
  const [totalRepairs, activeRepairs, completedRepairs, repairsByStatus, profitData] = await Promise.all([
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
        cost: true,
        partsCost: true,
        profit: true,
      },
      _avg: {
        profit: true,
      },
    }),
  ])

  return {
    totalRepairs,
    activeRepairs,
    completedRepairs,
    repairsByStatus,
    totalRevenue: profitData._sum.cost || 0,
    totalPartsCost: profitData._sum.partsCost || 0,
    totalProfit: profitData._sum.profit || 0,
    avgProfit: profitData._avg.profit || 0,
  }
}

export async function getRepairsByDevice() {
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

  try {
    const updateData: { status: RepairStatus; dateDelivered?: Date } = { status }

    // If status is DELIVERED, set dateDelivered
    if (status === 'DELIVERED') {
      updateData.dateDelivered = new Date()
    }

    const repair = await prisma.repair.update({
      where: { id },
      data: updateData,
    })

    revalidatePath('/repairs')
    revalidatePath(`/repairs/${id}`)
    return {
      success: 'Estado actualizado exitosamente',
      repair,
    }
  } catch (error) {
    return {
      error: 'Error al actualizar el estado',
    }
  }
}
