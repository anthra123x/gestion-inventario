'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { CreateProductSchema, UpdateProductSchema } from '@/lib/validations'
import { requireAuth } from '@/modules/auth/auth.actions'
import { parseError } from '@/lib/errors'

function toNullableId(value: FormDataEntryValue | null): string | null {
  const raw = typeof value === 'string' ? value : ''
  if (!raw || raw === 'null' || raw === 'undefined') return null
  return raw
}

export async function getProducts(search?: string, page = 1, take = 20, categoryId?: string) {
  await requireAuth()
  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { barcode: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
    ...(categoryId && { categoryId }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * take,
      take,
      select: {
        id: true,
        name: true,
        description: true,
        barcode: true,
        costPrice: true,
        salePrice: true,
        stock: true,
        lowStockThreshold: true,
        categoryId: true,
        supplierId: true,
        createdAt: true,
        category: { select: { id: true, name: true, color: true } },
        supplier: { select: { id: true, name: true } },
      },
    }),
    prisma.product.count({ where }),
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
  return await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      supplier: true,
    },
  })
}

export async function createProduct(formData: FormData) {
  await requireAuth()

  const validatedFields = CreateProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || null,
    barcode: formData.get('barcode') || null,
    costPrice: formData.get('costPrice') ? parseFloat(formData.get('costPrice') as string) : 0,
    salePrice: formData.get('salePrice') ? parseFloat(formData.get('salePrice') as string) : 0,
    stock: formData.get('stock') ? parseInt(formData.get('stock') as string) : 0,
    lowStockThreshold: formData.get('lowStockThreshold') ? parseInt(formData.get('lowStockThreshold') as string) : 5,
    categoryId: toNullableId(formData.get('categoryId')),
    supplierId: toNullableId(formData.get('supplierId')),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const product = await prisma.product.create({
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    return {
      success: 'Producto creado exitosamente',
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
    barcode: formData.get('barcode') || null,
    costPrice: formData.get('costPrice') ? parseFloat(formData.get('costPrice') as string) : undefined,
    salePrice: formData.get('salePrice') ? parseFloat(formData.get('salePrice') as string) : undefined,
    stock: formData.get('stock') ? parseInt(formData.get('stock') as string) : undefined,
    lowStockThreshold: formData.get('lowStockThreshold')
      ? parseInt(formData.get('lowStockThreshold') as string)
      : undefined,
    categoryId: toNullableId(formData.get('categoryId')),
    supplierId: toNullableId(formData.get('supplierId')),
  })

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues.map((e) => e.message).join(', '),
    }
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: validatedFields.data,
    })

    revalidatePath('/inventory')
    revalidatePath(`/inventory/${id}`)
    return {
      success: 'Producto actualizado exitosamente',
      product,
    }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function deleteProduct(id: string) {
  await requireAuth()

  try {
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    revalidatePath('/inventory')
    return {
      success: 'Producto eliminado exitosamente',
    }
  } catch {
    return {
      error: 'Error al eliminar el producto',
    }
  }
}
