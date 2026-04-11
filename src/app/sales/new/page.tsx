import { SaleForm } from '@/components/forms/sale-form'
import { createSale } from '@/modules/sales/sales.actions'
import { redirect } from 'next/navigation'

export default function NewSalePage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    
    const result = await createSale(formData)
    
    if (result?.error) {
      return { error: result.error }
    }
    
    redirect('/sales')
  }

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <SaleForm onSubmit={handleSubmit} />
    </div>
  )
}
