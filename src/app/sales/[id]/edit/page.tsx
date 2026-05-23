import { SaleForm } from '@/components/forms/sale-form'
import { getSaleById, updateSale } from '@/modules/sales/sales.actions'
import { redirect } from 'next/navigation'

export default async function EditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sale = await getSaleById(id)

  if (!sale) redirect('/sales')

  async function handleSubmit(formData: FormData) {
    'use server'
    return await updateSale(id, formData)
  }

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <SaleForm onSubmit={handleSubmit} redirectTo={`/sales/${id}`} initialData={sale as never} />
    </div>
  )
}
