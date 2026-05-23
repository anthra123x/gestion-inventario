'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function RepairsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al cargar reparaciones"
      description="No se pudieron cargar las reparaciones. Intenta de nuevo."
    />
  )
}
