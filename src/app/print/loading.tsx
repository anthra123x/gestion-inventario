import { Skeleton } from '@/components/ui/skeleton'

export default function PrintLoading() {
  return (
    <div className="p-8 space-y-6 max-w-4xl mx-auto">
      <Skeleton className="h-6 w-48 mx-auto" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}
