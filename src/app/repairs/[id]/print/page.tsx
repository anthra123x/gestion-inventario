import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function RepairPrintRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const repair = await prisma.repair.findUnique({
    where: { id },
    select: { id: true },
  })

  if (!repair) {
    redirect('/repairs')
  }

  redirect(`/print/repair/${id}`)
}
