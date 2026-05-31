'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireAdmin } from '@/modules/auth/auth.actions'
import { logAudit } from '@/modules/audit/audit.service'

export async function getEcommerceProducts(search?: string, page = 1, take = 20) {
  await requireAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    product: { deletedAt: null },
    ...(search && {
      OR: [
        { product: { name: { contains: search, mode: 'insensitive' as const } } },
        { slug: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const whereDeleted = { ...where, deletedAt: null }
  const [items, total] = await Promise.all([
    prisma.ecommerceProduct.findMany({
      where: whereDeleted,
      orderBy: [{ sortOrder: 'asc' }, { product: { name: 'asc' } }],
      skip: (page - 1) * take,
      take,
      include: {
        product: { select: { id: true, name: true, stock: true, salePrice: true, category: true } },
        media: { where: { isPrimary: true }, take: 1, select: { url: true, alt: true } },
      },
    }),
    prisma.ecommerceProduct.count({ where: whereDeleted }),
  ])

  return { products: items, total, page, totalPages: Math.ceil(total / take) }
}

export async function getEcommerceProductById(id: string) {
  await requireAdmin()
  return await prisma.ecommerceProduct.findFirst({
    where: { id, deletedAt: null },
    include: {
      product: true,
      media: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function getEcommerceProductByProductId(productId: string) {
  await requireAdmin()
  return await prisma.ecommerceProduct.findFirst({
    where: { productId, deletedAt: null },
    include: {
      product: true,
      media: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

export async function getProductsWithoutEcommerce(search?: string) {
  await requireAdmin()
  return await prisma.product.findMany({
    where: {
      deletedAt: null,
      ecommerce: null,
      ...(search && { name: { contains: search, mode: 'insensitive' as const } }),
    },
    select: { id: true, name: true, category: true, salePrice: true, stock: true },
    orderBy: { name: 'asc' },
    take: 50,
  })
}

const EcommerceSettingsSchema = z.object({
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
  ecommercePrice: z.coerce.number().min(0).optional().nullable(),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  slug: z.string().optional().nullable(),
  shortDescription: z.string().optional().nullable(),
  longDescription: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  badges: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  sortOrder: z.coerce.number().int().default(0),
  showStock: z.boolean().default(true),
})

export async function createEcommerceProduct(productId: string) {
  await requireAdmin()
  const product = await prisma.product.findUnique({
    where: { id: productId, deletedAt: null },
    select: { id: true, name: true, category: true },
  })

  if (!product) return { error: 'Producto no encontrado' }

  const existing = await prisma.ecommerceProduct.findUnique({ where: { productId } })
  if (existing) return { error: 'El producto ya tiene configuración de ecommerce' }

  const slug = product.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  try {
    await prisma.ecommerceProduct.create({
      data: {
        productId,
        slug: `${slug}-${productId.slice(-6)}`,
        visible: product.category !== 'REPAIR_PART',
        showStock: true,
      },
    })

    revalidatePath('/ecommerce')
    revalidatePath('/api/products')
    return { success: 'Producto agregado a la tienda' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { error: error.message || 'Error al crear registro ecommerce' }
  }
}

export async function updateEcommerceProduct(id: string, formData: FormData) {
  await requireAdmin()
  const rawData = {
    visible: formData.get('visible') === 'true',
    featured: formData.get('featured') === 'true',
    ecommercePrice: formData.get('ecommercePrice') ? Number(formData.get('ecommercePrice')) : null,
    compareAtPrice: formData.get('compareAtPrice') ? Number(formData.get('compareAtPrice')) : null,
    slug: formData.get('slug') || null,
    shortDescription: formData.get('shortDescription') || null,
    longDescription: formData.get('longDescription') || null,
    metaTitle: formData.get('metaTitle') || null,
    metaDescription: formData.get('metaDescription') || null,
    badges: formData.get('badges') ? JSON.parse(formData.get('badges') as string) : [],
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
    sortOrder: Number(formData.get('sortOrder')) || 0,
    showStock: formData.get('showStock') === 'true',
  }

  const validated = EcommerceSettingsSchema.safeParse(rawData)
  if (!validated.success) {
    const messages = validated.error.issues.map((i) => i.message).join(', ')
    return { error: messages }
  }

  try {
    await prisma.ecommerceProduct.update({
      where: { id },
      data: validated.data,
    })

    revalidatePath('/ecommerce')
    revalidatePath(`/ecommerce/products/${id}`)
    revalidatePath('/api/products')
    return { success: 'Configuración de tienda actualizada' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'El slug ya está en uso por otro producto' }
    }
    return { error: error.message || 'Error al actualizar' }
  }
}

export async function deleteEcommerceProduct(id: string) {
  await requireAdmin()
  try {
    await prisma.ecommerceProduct.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    revalidatePath('/ecommerce')
    revalidatePath('/api/products')
    logAudit('DELETE', 'ecommerce', id)
    return { success: 'Producto ocultado del catálogo' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar' }
  }
}

export async function getEcommerceStats() {
  await requireAdmin()
  const notDeleted = { deletedAt: null }
  const [totalPublished, totalVisible, featured, withDiscount, totalInventory] = await Promise.all([
    prisma.ecommerceProduct.count({ where: { ...notDeleted, publishedAt: { not: null } } }),
    prisma.ecommerceProduct.count({ where: { ...notDeleted, visible: true } }),
    prisma.ecommerceProduct.count({ where: { ...notDeleted, featured: true } }),
    prisma.ecommerceProduct.count({
      where: { ...notDeleted, compareAtPrice: { not: null }, visible: true },
    }),
    prisma.product.count({ where: { deletedAt: null, ecommerce: { deletedAt: null } } }),
  ])

  return { totalPublished, totalVisible, featured, withDiscount, totalInventory }
}

export async function toggleVisibility(id: string, visible: boolean) {
  await requireAdmin()
  try {
    await prisma.ecommerceProduct.update({
      where: { id },
      data: { visible, publishedAt: visible ? new Date() : null },
    })
    revalidatePath('/ecommerce')
    revalidatePath('/api/products')
    return { success: visible ? 'Producto publicado' : 'Producto ocultado' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { error: error.message || 'Error al cambiar visibilidad' }
  }
}

export async function addEcommerceImage(ecommerceId: string, url: string, isPrimary: boolean) {
  await requireAdmin()
  try {
    if (isPrimary) {
      await prisma.productMedia.updateMany({
        where: { ecommerceId, isPrimary: true },
        data: { isPrimary: false },
      })
    }

    const maxSort = await prisma.productMedia.findFirst({
      where: { ecommerceId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    await prisma.productMedia.create({
      data: {
        ecommerceId,
        url,
        isPrimary,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
        storageProvider: 'placeholder',
      },
    })

    revalidatePath(`/ecommerce/products/${ecommerceId}`)
    return { success: 'Imagen agregada' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { error: error.message || 'Error al agregar imagen' }
  }
}

export async function deleteEcommerceImage(id: string) {
  await requireAdmin()
  try {
    await prisma.productMedia.delete({ where: { id } })
    revalidatePath('/ecommerce/products', 'layout')
    return { success: 'Imagen eliminada' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { error: error.message || 'Error al eliminar imagen' }
  }
}

export async function reorderImages(mediaId: string, newOrder: number) {
  await requireAdmin()
  try {
    await prisma.productMedia.update({
      where: { id: mediaId },
      data: { sortOrder: newOrder },
    })
    revalidatePath('/ecommerce/products', 'layout')
    return { success: 'Orden actualizado' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { error: error.message || 'Error al reordenar' }
  }
}

export async function setPrimaryImage(mediaId: string, ecommerceId: string) {
  await requireAdmin()
  try {
    await prisma.productMedia.updateMany({
      where: { ecommerceId, isPrimary: true },
      data: { isPrimary: false },
    })
    await prisma.productMedia.update({
      where: { id: mediaId },
      data: { isPrimary: true },
    })
    revalidatePath(`/ecommerce/products/${ecommerceId}`)
    return { success: 'Imagen principal actualizada' }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return { error: error.message || 'Error al actualizar imagen principal' }
  }
}
