import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma, ProductCategory } from '@prisma/client'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const take = parseInt(searchParams.get('limit') || '50')
    const ecommerce = searchParams.get('ecommerce') === 'true'

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(ecommerce ? { ecommerce: { visible: true }, stock: { gt: 0 } } : { stock: { gt: 0 } }),
      ...(category && { category: category as ProductCategory }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const select: Prisma.ProductSelect = {
      id: true,
      name: true,
      description: true,
      category: true,
      salePrice: true,
      stock: true,
      ...(ecommerce && {
        ecommerce: {
          select: {
            id: true,
            ecommercePrice: true,
            compareAtPrice: true,
            slug: true,
            shortDescription: true,
            longDescription: true,
            badges: true,
            tags: true,
            showStock: true,
            featured: true,
            media: {
              where: { isPrimary: true },
              take: 1,
              select: { url: true, alt: true },
            },
          },
        },
      }),
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select,
        skip: (page - 1) * take,
        take,
        orderBy: ecommerce ? [{ ecommerce: { sortOrder: 'asc' } }, { name: 'asc' }] : { name: 'asc' },
      }),
      prisma.product.count({ where }),
    ])

    const result: Record<string, unknown>[] = []
    for (const p of products) {
      const base: Record<string, unknown> = {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        stock: p.stock,
        salePrice: p.salePrice,
      }
      if (ecommerce && p.ecommerce) {
        const ecom = p.ecommerce as Record<string, unknown>
        result.push({
          ...base,
          ecommerceId: ecom.id,
          ecommercePrice: ecom.ecommercePrice,
          compareAtPrice: ecom.compareAtPrice,
          slug: ecom.slug,
          shortDescription: ecom.shortDescription,
          longDescription: ecom.longDescription,
          badges: ecom.badges,
          tags: ecom.tags,
          showStock: ecom.showStock,
          featured: ecom.featured,
          image: (ecom.media as { url: string; alt: string | null }[])?.[0] || null,
        })
      } else {
        result.push(base)
      }
    }

    return NextResponse.json({ products: result, total, page, totalPages: Math.ceil(total / take) })
  } catch (_error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
