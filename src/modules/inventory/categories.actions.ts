'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateProductCategorySchema, UpdateProductCategorySchema } from '@/lib/validations'
import { requireAuth } from '@/modules/auth/auth.actions'
import { parseError } from '@/lib/errors'

export async function getCategories() {
  await requireAuth()
  return await prisma.productCategory.findMany({
    where: { deletedAt: null },
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
}

export async function getCategoryById(id: string) {
  await requireAuth()
  return await prisma.productCategory.findUnique({
    where: { id },
    include: { products: true },
  })
}

export async function createCategory(formData: FormData) {
  await requireAuth()

  const validatedFields = CreateProductCategorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color') || null,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const category = await prisma.productCategory.create({
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    return {
      success: 'Categoría creada exitosamente',
      category,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAuth()

  const validatedFields = UpdateProductCategorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color') || null,
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const category = await prisma.productCategory.update({
      where: { id },
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    revalidatePath(`/inventory/categories`)
    return {
      success: 'Categoría actualizada exitosamente',
      category,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function deleteCategory(id: string) {
  await requireAuth()

  try {
    await prisma.productCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/inventory')
    return {
      success: 'Categoría eliminada exitosamente',
    }
  } catch {
    return {
      error: 'Error al eliminar la categoría',
    }
  }
}
