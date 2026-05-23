'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function ReportsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al cargar reportes"
      description="No se pudieron generar los reportes. Verifica los filtros e intenta de nuevo."
    />
  )
}
