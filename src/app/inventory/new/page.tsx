import { ProductForm } from '@/components/forms/product-form'
import { createProduct } from '@/modules/inventory/inventory.actions'
import { redirect } from 'next/navigation'

export default function NewProductPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    
    const result = await createProduct(formData)
    
    if (result?.error) {
      // Handle error - you might want to return this to the client
      return { error: result.error }
    }
    
    redirect('/inventory')
  }

  return (
    <div className="container mx-auto py-6">
      <ProductForm onSubmit={handleSubmit} />
    </div>
  )
}
