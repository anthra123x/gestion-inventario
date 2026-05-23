import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/ecommerce/products/[id]
 *
 * Returns a single visible ecommerce product.
 * The `id` can be a product ID, a slug, or "sku:REFERENCE".
 *
 * This is the endpoint the storefront should use to get
 * product detail data including images, pricing, badges, etc.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const ecommerceProduct = await prisma.ecommerceProduct.findFirst({
      where: {
        visible: true,
        product: { deletedAt: null },
        OR: [{ productId: id }, { slug: id }],
      },
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
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          select: {
            id: true,
            url: true,
            alt: true,
            width: true,
            height: true,
            sortOrder: true,
            isPrimary: true,
            storageProvider: true,
          },
        },
      },
    })

    if (!ecommerceProduct) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    const price = ecommerceProduct.ecommercePrice ?? ecommerceProduct.product.salePrice
    const primaryImage = ecommerceProduct.media.find((m) => m.isPrimary) || ecommerceProduct.media[0] || null

    return NextResponse.json({
      product: {
        id: ecommerceProduct.product.id,
        slug: ecommerceProduct.slug,
        name: ecommerceProduct.product.name,
        description: ecommerceProduct.shortDescription ?? ecommerceProduct.product.description,
        shortDescription: ecommerceProduct.shortDescription,
        longDescription: ecommerceProduct.longDescription,
        category: ecommerceProduct.product.category,
        price,
        compareAtPrice: ecommerceProduct.compareAtPrice,
        salePrice: ecommerceProduct.product.salePrice,
        stock: ecommerceProduct.product.stock,
        showStock: ecommerceProduct.showStock,
        inStock: ecommerceProduct.product.stock > 0,
        featured: ecommerceProduct.featured,
        badges: ecommerceProduct.badges,
        tags: ecommerceProduct.tags,
        metaTitle: ecommerceProduct.metaTitle,
        metaDescription: ecommerceProduct.metaDescription,
        images: ecommerceProduct.media.map((m) => ({
          id: m.id,
          url: m.url,
          alt: m.alt,
          width: m.width,
          height: m.height,
          sortOrder: m.sortOrder,
          isPrimary: m.isPrimary,
        })),
        primaryImage: primaryImage
          ? {
              url: primaryImage.url,
              alt: primaryImage.alt,
              width: primaryImage.width,
              height: primaryImage.height,
            }
          : null,
        createdAt: ecommerceProduct.createdAt.toISOString(),
        updatedAt: ecommerceProduct.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching ecommerce product:', error)
    return NextResponse.json({ error: 'Error al obtener producto' }, { status: 500 })
  }
}
