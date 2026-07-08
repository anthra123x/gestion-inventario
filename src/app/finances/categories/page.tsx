'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Edit, Trash2, Tags } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { getCategoryTypeLabel, getCategoryColor } from '@/lib/labels'
import {
  getFinanceCategories, createCategoryAction, updateCategoryAction, deleteCategoryAction,
} from '@/modules/finance/finance.actions'
import { toast } from 'sonner'

type Category = {
  id: string
  name: string
  type: string
  color: string | null
  budget: number | null
}

const COLOR_OPTIONS = [
  { value: 'blue', label: 'Azul' },
  { value: 'green', label: 'Verde' },
  { value: 'red', label: 'Rojo' },
  { value: 'yellow', label: 'Amarillo' },
  { value: 'purple', label: 'Púrpura' },
  { value: 'pink', label: 'Rosa' },
  { value: 'indigo', label: 'Índigo' },
  { value: 'orange', label: 'Naranja' },
  { value: 'teal', label: 'Teal' },
  { value: 'cyan', label: 'Cian' },
]

const TYPE_GROUPS = ['INCOME', 'EXPENSE', 'SAVING_GOAL']

function getGroupLabel(type: string) {
  const labels: Record<string, string> = {
    INCOME: 'Ingresos',
    EXPENSE: 'Gastos',
    SAVING_GOAL: 'Metas de Ahorro',
  }
  return labels[type] || type
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingCat, setEditingCat] = useState<Category | null>(null)
  const [deletingCat, setDeletingCat] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const loadCategories = useCallback(async () => {
    try {
      const data = await getFinanceCategories()
      setCategories(data as Category[])
    } catch {
      toast.error('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCategories() }, [loadCategories])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = new FormData(e.currentTarget)
      const result = await createCategoryAction(form)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.success)
      setCreateOpen(false)
      loadCategories()
    } catch {
      toast.error('Error al crear la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editingCat) return
    setSubmitting(true)
    try {
      const form = new FormData(e.currentTarget)
      const result = await updateCategoryAction(editingCat.id, form)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.success)
      setEditOpen(false)
      setEditingCat(null)
      loadCategories()
    } catch {
      toast.error('Error al actualizar la categoría')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deletingCat) return
    try {
      const result = await deleteCategoryAction(deletingCat.id)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.success)
      setDeleteOpen(false)
      setDeletingCat(null)
      loadCategories()
    } catch {
      toast.error('Error al eliminar la categoría')
    }
  }

  if (loading) {
    return (
      <div className="page-container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Categorías"
        description="Administra las categorías de ingresos, gastos y metas de ahorro"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nueva Categoría
          </Button>
        }
      />

      {categories.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Tags}
              title="Sin categorías"
              description="Crea tu primera categoría para organizar las transacciones."
              action={{ label: 'Nueva Categoría', onClick: () => setCreateOpen(true) }}
            />
          </CardContent>
        </Card>
      ) : (
        TYPE_GROUPS.map((group) => {
          const groupCats = categories.filter((c) => c.type === group)
          if (groupCats.length === 0) return null
          return (
            <div key={group} className="space-y-3">
              <h2 className="text-lg font-semibold">{getGroupLabel(group)}</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {groupCats.map((cat) => (
                  <Card key={cat.id} className="card-shadow border-border/60">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-4 w-4 rounded-full ${getCategoryColor(cat.color)}`} />
                          <div>
                            <p className="font-semibold">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getCategoryTypeLabel(cat.type)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => { setEditingCat(cat); setEditOpen(true) }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => { setDeletingCat(cat); setDeleteOpen(true) }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      {cat.budget !== null && (
                        <div className="mt-3 pt-3 border-t border-border/40 text-sm flex justify-between">
                          <span className="text-muted-foreground">Presupuesto:</span>
                          <span className="font-medium">{formatCurrency(cat.budget)}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Categoría</DialogTitle>
            <DialogDescription>Agrega una nueva categoría financiera.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nombre</Label>
              <Input id="create-name" name="name" required placeholder="Ej: Servicios" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-type">Tipo</Label>
              <Select name="type" defaultValue="EXPENSE">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                  <SelectItem value="EXPENSE">Gasto</SelectItem>
                  <SelectItem value="SAVING_GOAL">Meta de Ahorro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-color">Color</Label>
              <Select name="color" defaultValue="blue">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${getCategoryColor(opt.value)}`} />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-budget">Presupuesto (opcional)</Label>
              <Input id="create-budget" name="budget" type="number" min={0} step="0.01" placeholder="0" />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>Crear</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>Modifica los datos de la categoría.</DialogDescription>
          </DialogHeader>
          {editingCat && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input id="edit-name" name="name" defaultValue={editingCat.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tipo</Label>
                <Select name="type" defaultValue={editingCat.type}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCOME">Ingreso</SelectItem>
                    <SelectItem value="EXPENSE">Gasto</SelectItem>
                    <SelectItem value="SAVING_GOAL">Meta de Ahorro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Select name="color" defaultValue={editingCat.color || 'blue'}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${getCategoryColor(opt.value)}`} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-budget">Presupuesto (opcional)</Label>
                <Input
                  id="edit-budget"
                  name="budget"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={editingCat.budget ?? ''}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>Guardar</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Categoría</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la categoría <strong>{deletingCat?.name}</strong>? Esta acción no se puede deshacer.
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
