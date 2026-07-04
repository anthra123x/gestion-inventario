'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function RepairPrintError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al redirigir"
      description="No se pudo redirigir a la impresión. Intenta de nuevo."
    />
  )
}
