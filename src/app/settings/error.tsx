'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function SettingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al cargar configuración"
      description="No se pudo cargar la página de configuración. Intenta de nuevo."
    />
  )
}
