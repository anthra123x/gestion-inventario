'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function NewRepairError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al crear reparación"
      description="No se pudo cargar el formulario de creación. Intenta de nuevo."
    />
  )
}
