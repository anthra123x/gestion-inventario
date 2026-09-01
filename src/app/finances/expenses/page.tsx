'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/ui/page-header'
import { Pagination } from '@/components/ui/pagination'
import { formatCurrency } from '@/lib/format'
import {
  createExpense,
  deleteExpense,
  getExpenses,
} from '@/modules/finance/expenses.actions'
import { getFinanceCategories } from '@/modules/finance/finance.actions'
import { toast } from 'sonner'

type Expense = Awaited<ReturnType<typeof getExpenses>>['expenses'][number]
type CategoryOption = { id: string; name: string; color: string | null }

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getExpenses(page, 20)
      setExpenses(data.expenses)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      toast.error('Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    loadExpenses()
  }, [loadExpenses])

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getFinanceCategories('EXPENSE')
        setCategories((data as CategoryOption[]) ?? [])
      } catch {}
    }
    loadCategories()
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = new FormData(e.currentTarget)
      const description = (form.get('description') as string)?.trim() || ''
      const amount = Number(form.get('amount'))
      const categoryId = form.get('categoryId') as string
      const expenseDate = (form.get('expenseDate') as string) || undefined
      const notes = (form.get('notes') as string) || undefined

      if (!description || !amount || !categoryId) {
        toast.error('Completa los campos obligatorios')
        setSubmitting(false)
        return
      }
      if (amount <= 0) {
        toast.error('El monto debe ser mayor a cero')
        setSubmitting(false)
        return
      }

      const result = await createExpense({
        description,
        amount,
        categoryId,
        expenseDate: expenseDate ? new Date(expenseDate + 'T12:00:00') : undefined,
        notes,
      })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success || 'Gasto registrado')
      setCreateOpen(false)
      loadExpenses()
    } catch {
      toast.error('Error al crear el gasto')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!expenseToDelete) return
    try {
      const result = await deleteExpense(expenseToDelete.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success || 'Gasto eliminado')
      setDeleteOpen(false)
      setExpenseToDelete(null)
      loadExpenses()
    } catch {
      toast.error('Error al eliminar el gasto')
    }
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Gastos"
        description="Registra y administra los gastos operativos del negocio"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo Gasto
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Sin gastos registrados"
              description="Registra tu primer gasto operativo para verlo reflejado en el reporte financiero."
              action={{ label: 'Nuevo Gasto', onClick: () => setCreateOpen(true) }}
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(exp.expenseDate).toLocaleDateString('es-CO')}
                      </TableCell>
                      <TableCell className="font-medium">{exp.description}</TableCell>
                      <TableCell className="text-muted-foreground">{exp.category?.name || 'Sin categoría'}</TableCell>
                      <TableCell className="text-right font-bold tabular-nums text-red-600">
                        -{formatCurrency(exp.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setExpenseToDelete(exp)
                            setDeleteOpen(true)
                          }}
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
                entity="gastos"
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Gasto</DialogTitle>
            <DialogDescription>Registra un gasto operativo del negocio.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descripción *</Label>
              <Input id="description" name="description" required placeholder="Ej: Pago de arriendo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Monto *</Label>
                <Input id="amount" name="amount" type="number" min={0} step="100" required placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expenseDate">Fecha</Label>
                <Input
                  id="expenseDate"
                  name="expenseDate"
                  type="date"
                  defaultValue={new Date().toLocaleDateString('en-CA')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría *</Label>
              <Select name="categoryId">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay categorías de gasto. Créalas en{' '}
                  <a href="/finances/categories" className="text-primary underline">
                    Categorías
                  </a>
                  .
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea id="notes" name="notes" placeholder="Notas adicionales (opcional)" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Gasto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar el gasto <strong>{expenseToDelete?.description}</strong> por{' '}
              {formatCurrency(expenseToDelete?.amount || 0)}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
