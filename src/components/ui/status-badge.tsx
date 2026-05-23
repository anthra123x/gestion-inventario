'use client'

import { cn } from '@/lib/utils'

type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'purple'

interface StatusBadgeProps {
  variant?: StatusVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-gray-50 text-gray-700 border-gray-200',
  purple: 'bg-purple-50 text-purple-700 border-purple-200',
}

const dotClasses: Record<StatusVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-500',
  purple: 'bg-purple-500',
}

export function StatusBadge({ variant = 'neutral', children, className, dot = false }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotClasses[variant])} />}
      {children}
    </span>
  )
}

interface StatusDotProps {
  status: StatusVariant
  pulse?: boolean
  className?: string
}

export function StatusDot({ status, pulse = false, className }: StatusDotProps) {
  return (
    <span className={cn('relative flex h-2 w-2', className)}>
      <span
        className={cn(
          'absolute inline-flex h-full w-full rounded-full opacity-75',
          dotClasses[status],
          pulse && 'animate-ping',
        )}
      />
      <span className={cn('relative inline-flex h-2 w-2 rounded-full', dotClasses[status])} />
    </span>
  )
}
