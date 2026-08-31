import { ProductForm } from '@/components/forms/product-form'
import { createProduct } from '@/modules/inventory/inventory.actions'
import { getCategories } from '@/modules/inventory/categories.actions'
import { getSuppliers } from '@/modules/suppliers/suppliers.actions'
import { PageHeader } from '@/components/ui/page-header'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  const [categories, suppliersResult] = await Promise.all([getCategories(), getSuppliers()])

  async function handleSubmit(formData: FormData) {
    'use server'
    return await createProduct(formData)
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Nuevo Producto"
        description="Agregar un producto al inventario"
        actions={
          <Link href="/inventory">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
        }
      />
      <ProductForm
        onSubmit={handleSubmit}
        redirectTo="/inventory"
        categories={categories}
        suppliers={suppliersResult.suppliers}
      />
    </div>
  )
}
