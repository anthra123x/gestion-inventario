'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getZodErrorMessage } from '@/lib/zod-error'
import { CreateClientSchema, UpdateClientSchema } from '@/lib/validations'
import { requireAuth } from '@/modules/auth/auth.actions'
import { parseError } from '@/lib/errors'

export async function getClients(search?: string, take = 100) {
  await requireAuth()
  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  return await prisma.client.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    include: {
      repairs: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          device: true,
          status: true,
          laborCost: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          repairs: true,
        },
      },
    },
  })
}

export async function searchClients(search: string) {
  await requireAuth()
  if (!search || search.length < 2) return []

  return await prisma.client.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    },
    take: 10,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      address: true,
    },
  })
}

export async function getClientById(id: string) {
  await requireAuth()
  return await prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      repairs: {
        orderBy: { createdAt: 'desc' },
        include: {
          repairParts: {
            include: {
              part: true,
            },
          },
        },
      },
    },
  })
}

export async function createClient(formData: FormData) {
  await requireAuth()
  const validatedFields = CreateClientSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
  })

  if (!validatedFields.success) {
    return {
      error: getZodErrorMessage(validatedFields),
    }
  }

  try {
    const client = await prisma.client.create({
      data: validatedFields.data,
    })

    revalidatePath('/clients')
    return {
      success: 'Cliente creado exitosamente',
      client,
    }
  } catch (error) {
    const parsed = parseError(error)
    if (parsed.code === 'P2002') {
      const target = parsed.meta?.target as string[] | undefined
      if (target?.includes?.('phone')) {
        return { error: 'El teléfono ya está registrado en otro cliente.' }
      }
      return { error: 'Ya existe un registro con estos datos únicos.' }
    }
    return { error: parsed.message }
  }
}

export async function updateClient(id: string, formData: FormData) {
  await requireAuth()

  const validatedFields = UpdateClientSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
  })

  if (!validatedFields.success) {
    return {
      error: getZodErrorMessage(validatedFields),
    }
  }

  try {
    const client = await prisma.client.update({
      where: { id },
      data: validatedFields.data,
    })

    revalidatePath('/clients')
    revalidatePath(`/clients/${id}`)
    return {
      success: 'Cliente actualizado exitosamente',
      client,
    }
  } catch (error) {
    const parsed = parseError(error)
    if (parsed.code === 'P2002') {
      const target = parsed.meta?.target as string[] | undefined
      if (target?.includes?.('phone')) {
        return { error: 'El teléfono ya está registrado en otro cliente.' }
      }
      return { error: 'Ya existe un registro con estos datos únicos.' }
    }
    return { error: parsed.message }
  }
}

export async function deleteClient(id: string) {
  await requireAuth()

  try {
    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/clients')
    return {
      success: 'Cliente eliminado exitosamente',
    }
  } catch {
    return {
      error: 'Error al eliminar el cliente',
    }
  }
}

export async function getClientStats() {
  await requireAuth()
  const [totalClients, newClientsThisMonth, topClients] = await Promise.all([
    prisma.client.count({ where: { deletedAt: null } }),
    prisma.client.count({
      where: {
        deletedAt: null,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    }),
    prisma.client.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: {
        repairs: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            repairs: true,
          },
        },
        repairs: {
          select: {
            laborCost: true,
          },
        },
      },
    }),
  ])

  const topClientsWithSpending = topClients.map((client) => ({
    ...client,
    totalLabor: client.repairs.reduce((sum, r) => sum + r.laborCost, 0),
  }))

  return {
    totalClients,
    newClientsThisMonth,
    topClients: topClientsWithSpending,
  }
}
