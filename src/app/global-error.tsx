'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Error crítico</h1>
            <p className="text-muted-foreground">Ocurrió un error inesperado en la aplicación.</p>
            <Button onClick={reset}>Intentar de nuevo</Button>
          </div>
        </div>
      </body>
    </html>
  )
}
