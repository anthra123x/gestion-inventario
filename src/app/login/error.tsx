'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function LoginError({
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
      title="Error al cargar inicio de sesión"
      description="No se pudo cargar la página de inicio de sesión. Intenta de nuevo."
    />
  )
}
