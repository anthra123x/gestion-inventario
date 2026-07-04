import { Skeleton } from '@/components/ui/skeleton'

export default function PrintRepairLoading() {
  return (
    <div className="p-6 space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  )
}
