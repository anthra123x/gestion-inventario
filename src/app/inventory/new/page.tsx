import { ProductForm } from '@/components/forms/product-form'
import { createProduct } from '@/modules/inventory/inventory.actions'

export default function NewProductPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    return await createProduct(formData)
  }

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <ProductForm onSubmit={handleSubmit} redirectTo="/inventory" />
    </div>
  )
}
