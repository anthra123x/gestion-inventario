'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function NewSaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al crear venta"
      description="No se pudo cargar el formulario de venta. Intenta de nuevo."
    />
  )
}
