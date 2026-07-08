'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { formatCurrency } from '@/lib/format'
import { getTransactionTypeLabel, getTransactionTypeColor } from '@/lib/labels'
import { getTransactionsAction, deleteTransactionAction } from '@/modules/finance/finance.actions'
import { toast } from 'sonner'

type Transaction = Awaited<ReturnType<typeof getTransactionsAction>>['items'][number]
type CategoryOption = { id: string; name: string; type: string }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<string>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null)

  const filters = {
    ...(typeFilter !== 'ALL' && { type: typeFilter as 'INCOME' | 'EXPENSE' }),
    ...(categoryFilter !== 'ALL' && { categoryId: categoryFilter }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    page,
  }

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getTransactionsAction(filters)
      setTransactions(data.items)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast.error('Error al cargar transacciones')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, categoryFilter, startDate, endDate, page])

  useEffect(() => { loadTransactions() }, [loadTransactions])

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getTransactionsAction()
        const cats = data.items
          .filter((t): t is Transaction & { category: NonNullable<Transaction['category']> } => t.category !== null)
          .map((t) => ({ id: t.category.id, name: t.category.name, type: t.type }))
        const unique = Array.from(new Map(cats.map((c) => [c.id, c])).values())
        setCategories(unique)
      } catch {}
    }
    loadCategories()
  }, [])

  const handleDelete = async () => {
    if (!txToDelete) return
    try {
      const result = await deleteTransactionAction(txToDelete.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Transacción eliminada')
      setDeleteOpen(false)
      setTxToDelete(null)
      loadTransactions()
    } catch {
      toast.error('Error al eliminar la transacción')
    }
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Transacciones"
        description="Historial de ingresos y gastos"
        actions={
          <Button render={<Link href="/finances/transactions/new" />}>
            <Plus className="h-4 w-4" />
            Nueva Transacción
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? 'ALL'); setPage(1) }}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                  <SelectItem value="EXPENSE">Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v ?? 'ALL'); setPage(1) }}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1) }} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1) }} className="w-40" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title="Sin transacciones"
              description="No hay transacciones registradas con los filtros actuales."
              action={{ label: 'Nueva Transacción', href: '/finances/transactions/new' }}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell className="font-medium">{tx.description}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {tx.category?.name || 'Sin categoría'}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getTransactionTypeColor(tx.type)}`}>
                          {getTransactionTypeLabel(tx.type)}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-bold tabular-nums ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => { setTxToDelete(tx); setDeleteOpen(true) }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                entity="transacciones"
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Transacción</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar esta transacción? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
