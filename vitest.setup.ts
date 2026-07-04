import { vi } from 'vitest'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/modules/notifications/notifications.actions', () => ({
  notifyUsers: vi.fn().mockResolvedValue(undefined),
  createNotification: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/errors', async () => {
  const actual = await vi.importActual('@/lib/errors')
  return {
    ...actual,
    parseError: vi.fn((error: unknown, fallbackMessage?: string) => {
      if (error instanceof Error) return { message: error.message }
      return { message: fallbackMessage || 'Error desconocido' }
    }),
  }
})
