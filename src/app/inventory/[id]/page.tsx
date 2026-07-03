import { ProductForm } from '@/components/forms/product-form'
import { updateProduct, getProductById } from '@/modules/inventory/inventory.actions'
import { notFound } from 'next/navigation'

interface PartPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PartPage({ params }: PartPageProps) {
  const { id } = await params
  const part = await getProductById(id)

  if (!part) {
    notFound()
  }

  async function handleSubmit(formData: FormData) {
    'use server'

    const result = await updateProduct(id, formData)

    if (result?.error) {
      return { error: result.error }
    }

    return { success: result?.success }
  }

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <ProductForm product={part} onSubmit={handleSubmit} />
    </div>
  )
}
