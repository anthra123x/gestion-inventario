'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error en administración"
      description="No se pudieron cargar los datos de administración. Intenta de nuevo."
    />
  )
}
