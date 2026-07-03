'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground text-balance">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1 text-pretty">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  )
}
