import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const take = parseInt(searchParams.get('limit') || '50')
    const ecommerce = searchParams.get('ecommerce') === 'true'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      deletedAt: null,
      ...(ecommerce ? { ecommerce: { visible: true }, stock: { gt: 0 } } : { stock: { gt: 0 } }),
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const select: any = {
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = products.map((p: any) => {
      const base = {
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        stock: p.stock,
        salePrice: p.salePrice,
      }
      if (ecommerce && p.ecommerce) {
        return {
          ...base,
          ecommerceId: p.ecommerce.id,
          ecommercePrice: p.ecommerce.ecommercePrice,
          compareAtPrice: p.ecommerce.compareAtPrice,
          slug: p.ecommerce.slug,
          shortDescription: p.ecommerce.shortDescription,
          longDescription: p.ecommerce.longDescription,
          badges: p.ecommerce.badges,
          tags: p.ecommerce.tags,
          showStock: p.ecommerce.showStock,
          featured: p.ecommerce.featured,
          image: p.ecommerce.media[0] || null,
        }
      }
      return base
    })

    return NextResponse.json({ products: result, total, page, totalPages: Math.ceil(total / take) })
  } catch (_error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
