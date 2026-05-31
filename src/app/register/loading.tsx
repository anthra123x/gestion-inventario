import { Skeleton } from '@/components/ui/skeleton'

export default function RegisterLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Skeleton className="h-24 w-64 rounded-xl" />
    </div>
  )
}
