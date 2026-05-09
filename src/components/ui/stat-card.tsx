'use client'

import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from './card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: string
  icon: LucideIcon
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  className?: string
}

const colorMap = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-emerald-500/10 text-emerald-600',
  warning: 'bg-amber-500/10 text-amber-600',
  danger: 'bg-red-500/10 text-red-600',
  info: 'bg-blue-500/10 text-blue-600',
  purple: 'bg-purple-500/10 text-purple-600',
}

export function StatCard({ title, value, change, icon: Icon, color = 'default', className }: StatCardProps) {
  return (
    <Card className={cn('stat-card group', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {change && (
              <p className="text-xs text-muted-foreground/70">{change}</p>
            )}
          </div>
          <div className={cn(
            'rounded-xl p-3 transition-transform duration-200 group-hover:scale-110',
            colorMap[color]
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardGridProps {
  children: React.ReactNode
  columns?: 2 | 3 | 4
  className?: string
}

export function StatCardGrid({ children, columns = 4, className }: StatCardGridProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }
  
  return (
    <div className={cn('grid gap-4 lg:gap-6', gridCols[columns], className)}>
      {children}
    </div>
  )
}