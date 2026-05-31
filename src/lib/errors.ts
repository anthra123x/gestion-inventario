import * as Sentry from '@sentry/nextjs'
import type { ActionResult } from '@/types/actions'

export class AppError extends Error {
  public readonly code: string
  public readonly status: number

  constructor(message: string, code = 'INTERNAL_ERROR', status = 500) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409)
    this.name = 'ConflictError'
  }
}

const PRISMA_CODE_MAP: Record<string, (message: string) => AppError> = {
  P2002: (m) => new ConflictError('El registro ya existe'),
  P2025: () => new NotFoundError(),
  P2003: () => new AppError('Registro relacionado no encontrado', 'FOREIGN_KEY', 400),
}

export function handlePrismaError(error: { code?: string; message?: string }): AppError {
  const factory = error.code ? PRISMA_CODE_MAP[error.code] : undefined
  if (factory) return factory(error.message || '')
  return new AppError(error.message || 'Error en la base de datos', 'DB_ERROR', 500)
}

export async function tryCatch<T>(
  fn: () => Promise<T>,
  options?: { sentry?: boolean; context?: string },
): Promise<ActionResult<T>> {
  try {
    const data = await fn()
    return { success: true, data }
  } catch (error) {
    let appError: AppError

    if (error instanceof AppError) {
      appError = error
    } else if (error && typeof error === 'object' && 'code' in error) {
      appError = handlePrismaError(error as { code?: string; message?: string })
    } else if (error instanceof Error) {
      appError = new AppError(error.message)
    } else {
      appError = new AppError('Error desconocido')
    }

    if (options?.sentry !== false) {
      Sentry.captureException(error, {
        tags: { context: options?.context || 'server-action' },
        extra: { code: appError.code },
      })
    }

    return { success: false, error: appError.message }
  }
}
