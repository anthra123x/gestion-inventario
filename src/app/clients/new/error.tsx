'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function NewClientError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al crear cliente"
      description="No se pudo cargar el formulario. Intenta de nuevo."
    />
  )
}
