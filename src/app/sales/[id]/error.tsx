'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function SaleDetailError({
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
      title="Error al cargar la venta"
      description="No se pudo cargar la venta. Intenta de nuevo."
    />
  )
}
