'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  entity: string
  onPageChange: (page: number) => void
}

function getVisiblePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | 'ellipsis')[] = []

  pages.push(1)

  if (current > 3) {
    pages.push('ellipsis')
  }

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (current < total - 2) {
    pages.push('ellipsis')
  }

  pages.push(total)

  return pages
}

export function Pagination({ page, totalPages, total, entity, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages(page, totalPages)

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <p className="text-sm text-muted-foreground tabular-nums">
        Página {page} de {totalPages} &mdash; {total} {entity}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
        <div className="hidden sm:flex items-center gap-1">
          {visiblePages.map((p, i) =>
            p === 'ellipsis' ? (
              <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">
                &hellip;
              </span>
            ) : (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className={cn(
                  'min-w-9 transition-all duration-150',
                  p === page && 'bg-primary text-primary-foreground border-0 hover:opacity-90',
                )}
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            ),
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
