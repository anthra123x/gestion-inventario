import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function SalePrintRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const sale = await prisma.sale.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!sale) {
    redirect('/sales')
  }

  redirect(`/print/${id}`)
}
