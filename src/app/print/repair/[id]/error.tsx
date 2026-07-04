'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function PrintRepairError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al generar impresión"
      description="No se pudo cargar la vista de impresión. Intenta de nuevo."
    />
  )
}
