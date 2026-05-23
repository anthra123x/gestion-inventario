'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function EditRepairError({
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
      title="Error al cargar la reparación"
      description="No se pudo cargar el formulario de edición. Intenta de nuevo."
    />
  )
}
