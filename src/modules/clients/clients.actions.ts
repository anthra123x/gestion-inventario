'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getZodErrorMessage } from '@/lib/zod-error'
import { CreateClientSchema, UpdateClientSchema } from '@/lib/validations'
import { getCurrentUser } from '@/modules/auth/auth.actions'

export async function getClients(search?: string) {
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
    include: {
      sales: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          total: true,
          createdAt: true,
        },
      },
      repairs: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          device: true,
          status: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          sales: true,
          repairs: true,
        },
      },
    },
  })
}

export async function getClientById(id: string) {
  return await prisma.client.findFirst({
    where: { id, deletedAt: null },
    include: {
      sales: {
        orderBy: { createdAt: 'desc' },
        include: {
          saleItems: {
            include: {
              product: true,
            },
          },
        },
      },
      repairs: {
        orderBy: { createdAt: 'desc' },
        include: {
          repairParts: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  })
}

export async function createClient(formData: FormData) {
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
  } catch (error: any) {
    // Manejar error de unique constraint específicamente
    if (error.code === 'P2002') {
      const target = error.meta?.target
      if (target && target.includes('phone')) {
        return {
          error: 'El teléfono ya está registrado en otro cliente.',
        }
      }
      return {
        error: 'Ya existe un registro con estos datos únicos.',
      }
    }

    return {
      error: error instanceof Error ? error.message : 'Error al crear el cliente',
    }
  }
}

export async function updateClient(id: string, formData: FormData) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No autorizado')

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
  } catch (error: any) {
    // Manejar error de unique constraint específicamente
    if (error.code === 'P2002') {
      const target = error.meta?.target
      if (target && target.includes('phone')) {
        return {
          error: 'El teléfono ya está registrado en otro cliente.',
        }
      }
      return {
        error: 'Ya existe un registro con estos datos únicos.',
      }
    }

    return {
      error: error instanceof Error ? error.message : 'Error al actualizar el cliente',
    }
  }
}

export async function deleteClient(id: string) {
  const user = await getCurrentUser()
  if (!user) throw new Error('No autorizado')

  try {
    await prisma.client.delete({
      where: { id },
    })

    revalidatePath('/clients')
    return {
      success: 'Cliente eliminado exitosamente',
    }
  } catch (error) {
    return {
      error: 'Error al eliminar el cliente',
    }
  }
}

export async function getClientStats() {
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
        sales: {
          _count: 'desc',
        },
      },
      include: {
        _count: {
          select: {
            sales: true,
            repairs: true,
          },
        },
        sales: {
          select: {
            total: true,
          },
        },
      },
    }),
  ])

  // Calculate total spent for each top client
  const topClientsWithSpending = topClients.map(client => ({
    ...client,
    totalSpent: client.sales.reduce((sum, sale) => sum + sale.total, 0),
  }))

  return {
    totalClients,
    newClientsThisMonth,
    topClients: topClientsWithSpending,
  }
}
