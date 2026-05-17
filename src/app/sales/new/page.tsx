import { SaleForm } from '@/components/forms/sale-form'
import { createSale } from '@/modules/sales/sales.actions'

export default function NewSalePage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    return await createSale(formData)
  }

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <SaleForm onSubmit={handleSubmit} redirectTo="/sales" />
    </div>
  )
}
