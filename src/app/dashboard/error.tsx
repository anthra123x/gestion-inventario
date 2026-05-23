'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al cargar el dashboard"
      description="No se pudieron cargar las estadísticas. Verifica la conexión con la base de datos."
    />
  )
}
