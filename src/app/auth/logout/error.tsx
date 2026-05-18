'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function LogoutError({
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
      title="Error al cerrar sesión"
      description="No se pudo cerrar la sesión. Intenta de nuevo."
    />
  )
}
