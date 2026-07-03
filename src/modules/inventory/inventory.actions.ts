'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateProductSchema, UpdateProductSchema } from '@/lib/validations'
import { requireAuth } from '@/modules/auth/auth.actions'
import { parseError } from '@/lib/errors'

export async function getProducts(search?: string, page = 1, take = 20) {
  await requireAuth()
  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [products, total] = await Promise.all([
    prisma.part.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        name: true,
        description: true,
        supplier: true,
        price: true,
        createdAt: true,
      },
    }),
    prisma.part.count({ where }),
  ])

  return {
    products,
    total,
    page,
    totalPages: Math.ceil(total / take),
  }
}

export async function getProductById(id: string) {
  await requireAuth()
  return await prisma.part.findUnique({
    where: { id },
  })
}

export async function createProduct(formData: FormData) {
  await requireAuth()

  const validatedFields = CreateProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    supplier: formData.get('supplier') || null,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : 0,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const product = await prisma.part.create({
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    revalidatePath('/repairs/new')
    return {
      success: 'Repuesto creado exitosamente',
      product,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAuth()

  const validatedFields = UpdateProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    supplier: formData.get('supplier') || null,
    price: formData.get('price') ? parseFloat(formData.get('price') as string) : undefined,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const product = await prisma.part.update({
      where: { id },
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    revalidatePath(`/inventory/${id}`)
    revalidatePath('/repairs/new')
    return {
      success: 'Repuesto actualizado exitosamente',
      product,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function deleteProduct(id: string) {
  await requireAuth()

  try {
    await prisma.part.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/inventory')
    return {
      success: 'Repuesto eliminado exitosamente',
    }
  } catch {
    return {
      error: 'Error al eliminar el repuesto',
    }
  }
}
