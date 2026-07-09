'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function NotificationsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="page-container py-6">
      <ErrorFallback error={error} reset={reset} />
    </div>
  )
}