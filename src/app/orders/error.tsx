'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function OrdersError({
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
      title="Error al cargar pedidos"
      description="No se pudieron cargar los pedidos online. Intenta de nuevo."
    />
  )
}
