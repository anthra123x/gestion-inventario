'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorFallbackProps {
  error?: Error & { digest?: string }
  reset?: () => void
  title?: string
  description?: string
}

export function ErrorFallback({
  error,
  reset,
  title = 'Algo salió mal',
  description = 'Ocurrió un error inesperado. Intenta de nuevo o vuelve al inicio.',
}: ErrorFallbackProps) {
  useEffect(() => {
    if (error) Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-6">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground text-center max-w-md mb-6">{description}</p>
      {error?.digest && <p className="text-xs text-muted-foreground mb-4 font-mono">Error ID: {error.digest}</p>}
      <div className="flex gap-3">
        {reset && (
          <Button onClick={reset} variant="default">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        )}
        <Link href="/dashboard">
          <Button variant="outline">
            <Home className="h-4 w-4 mr-2" />
            Ir al inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}
