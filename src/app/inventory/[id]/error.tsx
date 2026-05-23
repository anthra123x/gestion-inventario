'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function ProductDetailError({
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
      title="Error al cargar el producto"
      description="No se pudo cargar el producto. Intenta de nuevo."
    />
  )
}
