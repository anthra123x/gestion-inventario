'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function OrderDetailError({
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
      title="Error al cargar el pedido"
      description="No se pudo cargar el pedido. Intenta de nuevo."
    />
  )
}
