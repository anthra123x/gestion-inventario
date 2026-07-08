'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, PiggyBank, Target, Calendar, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency } from '@/lib/format'
import {
  getSavingGoalsAction, createSavingGoalAction, updateSavingGoalAction, deleteSavingGoalAction,
  getFinanceCategories,
} from '@/modules/finance/finance.actions'
import { toast } from 'sonner'

type Goal = Awaited<ReturnType<typeof getSavingGoalsAction>>[number]
type Category = { id: string; name: string; type: string }

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addAmountOpen, setAddAmountOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  const [addingGoal, setAddingGoal] = useState<Goal | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [goalsData, catsData] = await Promise.all([
        getSavingGoalsAction(),
        getFinanceCategories(),
      ])
      setGoals(goalsData)
      setCategories(catsData as Category[])
    } catch {
      toast.error('Error al cargar metas de ahorro')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const goalCategories = categories.filter((c) => c.type === 'SAVING_GOAL')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = new FormData(e.currentTarget)
      const result = await createSavingGoalAction(form)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.success)
      setCreateOpen(false)
      loadData()
    } catch {
      toast.error('Error al crear la meta')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingGoal) return
    setSubmitting(true)
    try {
      const form = new FormData(e.currentTarget)
      const result = await updateSavingGoalAction(editingGoal.id, form)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.success)
      setEditOpen(false)
      setEditingGoal(null)
      loadData()
    } catch {
      toast.error('Error al actualizar la meta')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAddAmount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!addingGoal) return
    setSubmitting(true)
    try {
      const form = new FormData(e.currentTarget)
      const result = await updateSavingGoalAction(addingGoal.id, form)
      if (result.error) { toast.error(result.error); return }
      toast.success('Monto actualizado')
      setAddAmountOpen(false)
      setAddingGoal(null)
      loadData()
    } catch {
      toast.error('Error al actualizar el monto')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingGoal) return
    try {
      const result = await deleteSavingGoalAction(deletingGoal.id)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.success)
      setDeleteOpen(false)
      setDeletingGoal(null)
      loadData()
    } catch {
      toast.error('Error al eliminar la meta')
    }
  }

  if (loading) {
    return (
      <div className="page-container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Metas de Ahorro"
        description="Define y da seguimiento a tus objetivos financieros"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva Meta
          </Button>
        }
      />

      {goals.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={PiggyBank}
              title="Sin metas de ahorro"
              description="Crea tu primera meta de ahorro para empezar a trackear tu progreso."
              action={{ label: 'Crear Primera Meta', onClick: () => setCreateOpen(true) }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progress = goal.targetAmount > 0
              ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
              : 0
            return (
              <Card key={goal.id} className="card-shadow border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Target className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{goal.name}</CardTitle>
                        {goal.category && (
                          <p className="text-xs text-muted-foreground">{goal.category.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setEditingGoal(goal); setEditOpen(true) }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => { setDeletingGoal(goal); setDeleteOpen(true) }}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm pt-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Actual</p>
                      <p className="font-semibold">{formatCurrency(goal.currentAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Meta</p>
                      <p className="font-semibold">{formatCurrency(goal.targetAmount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {goal.deadline && (
                        <>
                          <Calendar className="h-3 w-3" />
                          {new Date(goal.deadline).toLocaleDateString('es-CO')}
                        </>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setAddingGoal(goal); setAddAmountOpen(true) }}
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Meta de Ahorro</DialogTitle>
            <DialogDescription>Define un nuevo objetivo financiero.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre</Label>
              <Input id="create-name" name="name" required placeholder="Ej: Viaje a la playa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-targetAmount">Meta total</Label>
              <Input id="create-targetAmount" name="targetAmount" type="number" min={1} step="0.01" required placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-currentAmount">Monto actual (opcional)</Label>
              <Input id="create-currentAmount" name="currentAmount" type="number" min={0} step="0.01" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-deadline">Fecha límite (opcional)</Label>
              <Input id="create-deadline" name="deadline" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-categoryId">Categoría (opcional)</Label>
              <Select name="categoryId" defaultValue="">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin categoría</SelectItem>
                  {goalCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>Crear Meta</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
            <DialogDescription>Modifica los datos de la meta de ahorro.</DialogDescription>
          </DialogHeader>
          {editingGoal && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input id="edit-name" name="name" defaultValue={editingGoal.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-targetAmount">Meta total</Label>
                <Input id="edit-targetAmount" name="targetAmount" type="number" min={1} step="0.01" defaultValue={editingGoal.targetAmount} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currentAmount">Monto actual</Label>
                <Input id="edit-currentAmount" name="currentAmount" type="number" min={0} step="0.01" defaultValue={editingGoal.currentAmount} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-deadline">Fecha límite (opcional)</Label>
                <Input
                  id="edit-deadline"
                  name="deadline"
                  type="date"
                  defaultValue={editingGoal.deadline ? new Date(editingGoal.deadline).toISOString().split('T')[0] : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-categoryId">Categoría (opcional)</Label>
                <Select name="categoryId" defaultValue={editingGoal.categoryId || ''}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin categoría</SelectItem>
                    {goalCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>Guardar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Amount Dialog */}
      <Dialog open={addAmountOpen} onOpenChange={setAddAmountOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar a Meta</DialogTitle>
            <DialogDescription>
              Actualiza el monto actual de <strong>{addingGoal?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          {addingGoal && (
            <form onSubmit={handleAddAmount} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-currentAmount">Nuevo monto actual</Label>
                <Input
                  id="add-currentAmount"
                  name="currentAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={addingGoal.currentAmount}
                  required
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setAddAmountOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>Actualizar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Meta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la meta <strong>{deletingGoal?.name}</strong>? Esta acción no se puede deshacer.
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
