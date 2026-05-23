import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

/**
 * GET /api/ecommerce/products
 *
 * Returns ONLY visible ecommerce products with all data needed
 * by the storefront (Tecnicell Store).
 *
 * Query params:
 *   - category: ProductCategory filter
 *   - search: text search on name
 *   - page: page number (default 1)
 *   - limit: items per page (default 50)
 *   - featured: "true" to filter featured only
 *   - slugs: comma-separated list of slugs to fetch specific products
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const featured = searchParams.get('featured')
    const slugsParam = searchParams.get('slugs')

    const where: Prisma.EcommerceProductWhereInput = {
      visible: true,
      product: {
        deletedAt: null,
        stock: { gt: 0 },
      },
      ...(category &&
        category !== 'ALL' && {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          product: { category: category as any },
        }),
      ...(featured === 'true' && { featured: true }),
      ...(slugsParam && {
        slug: {
          in: slugsParam
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
      }),
    }

    if (search) {
      where.product = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...((where.product as any) || {}),
        name: { contains: search, mode: 'insensitive' as const },
      }
    }

    const [products, total] = await Promise.all([
      prisma.ecommerceProduct.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { product: { createdAt: 'desc' } }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              stock: true,
              salePrice: true,
            },
          },
          media: {
            where: { isPrimary: true },
            take: 1,
            orderBy: { sortOrder: 'asc' },
          },
        },
      }),
      prisma.ecommerceProduct.count({ where }),
    ])

    const mapped = products.map((ep) => {
      const price = ep.ecommercePrice ?? ep.product.salePrice
      const primaryImage = ep.media.find((m) => m.isPrimary) || ep.media[0] || null

      return {
        id: ep.product.id,
        slug: ep.slug,
        name: ep.product.name,
        description: ep.shortDescription ?? ep.product.description,
        shortDescription: ep.shortDescription,
        longDescription: ep.longDescription,
        category: ep.product.category,
        price,
        compareAtPrice: ep.compareAtPrice,
        salePrice: ep.product.salePrice,
        stock: ep.product.stock,
        showStock: ep.showStock,
        inStock: ep.product.stock > 0,
        featured: ep.featured,
        badges: ep.badges,
        tags: ep.tags,
        image: primaryImage
          ? {
              url: primaryImage.url,
              alt: primaryImage.alt,
              width: primaryImage.width,
              height: primaryImage.height,
            }
          : null,
        createdAt: ep.createdAt.toISOString(),
        updatedAt: ep.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      products: mapped,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching ecommerce products:', error)
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}
