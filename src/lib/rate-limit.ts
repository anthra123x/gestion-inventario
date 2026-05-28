const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(
  key: string,
  opts: { maxRequests?: number; windowMs?: number } = {},
): { allowed: boolean; remaining: number; resetAt: number } {
  const maxRequests = opts.maxRequests ?? 10
  const windowMs = opts.windowMs ?? 60_000
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}
