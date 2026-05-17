'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function EcommerceError({
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
      title="Error al cargar catálogo"
      description="No se pudieron cargar los datos del catálogo online. Intenta de nuevo."
    />
  )
}
