import { Skeleton } from '@/components/ui/skeleton'

export default function SalesLoading() {
  return (
    <div className="page-container py-6 space-y-6">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Skeleton className="h-[500px] w-full" />
        </div>
        <div>
          <Skeleton className="h-[500px] w-full" />
        </div>
      </div>
    </div>
  )
}
