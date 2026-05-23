'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function NewProductError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al crear producto"
      description="No se pudo cargar el formulario de creación. Intenta de nuevo."
    />
  )
}
