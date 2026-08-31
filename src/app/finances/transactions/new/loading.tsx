import { Skeleton } from '@/components/ui/skeleton'

export default function NewTransactionLoading() {
  return (
    <div className="page-container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-28" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}
