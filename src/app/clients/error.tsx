'use client'

import { ErrorFallback } from '@/components/ui/error-fallback'

export default function ClientsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorFallback
      error={error}
      reset={reset}
      title="Error al cargar clientes"
      description="No se pudieron cargar los clientes. Intenta de nuevo."
    />
  )
}
