'use client'

import { Button } from '@/components/ui/button'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  entity: string
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, entity, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between px-6 py-4 border-t">
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages} — {total} {entity}
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </Button>
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
