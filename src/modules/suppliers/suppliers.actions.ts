'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateSupplierSchema, UpdateSupplierSchema } from '@/lib/validations'
import { requireAuth } from '@/modules/auth/auth.actions'
import { parseError } from '@/lib/errors'

export async function getSuppliers(search?: string, page = 1, take = 20) {
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

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * take,
      take,
      include: { _count: { select: { products: true } } },
    }),
    prisma.supplier.count({ where }),
  ])

  return {
    suppliers,
    total,
    page,
    totalPages: Math.ceil(total / take),
  }
}

export async function searchSuppliers(search: string) {
  await requireAuth()
  if (search.length < 2) return []

  return await prisma.supplier.findMany({
    where: {
      deletedAt: null,
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search, mode: 'insensitive' as const } },
      ],
    },
    take: 10,
    orderBy: { name: 'asc' },
  })
}

export async function getSupplierById(id: string) {
  await requireAuth()
  return await prisma.supplier.findUnique({
    where: { id },
    include: { products: true },
  })
}

export async function createSupplier(formData: FormData) {
  await requireAuth()

  const validatedFields = CreateSupplierSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') || null,
    email: formData.get('email') || null,
    address: formData.get('address') || null,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const supplier = await prisma.supplier.create({
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    revalidatePath('/inventory/suppliers')
    return {
      success: 'Proveedor creado exitosamente',
      supplier,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function updateSupplier(id: string, formData: FormData) {
  await requireAuth()

  const validatedFields = UpdateSupplierSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone') || null,
    email: formData.get('email') || null,
    address: formData.get('address') || null,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    revalidatePath('/inventory/suppliers')
    revalidatePath(`/inventory/suppliers/${id}`)
    return {
      success: 'Proveedor actualizado exitosamente',
      supplier,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function deleteSupplier(id: string) {
  await requireAuth()

  try {
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/inventory')
    revalidatePath('/inventory/suppliers')
    return {
      success: 'Proveedor eliminado exitosamente',
    }
  } catch {
    return {
      error: 'Error al eliminar el proveedor',
    }
  }
}
