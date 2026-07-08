'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/ui/page-header'
import { createTransactionAction, getFinanceCategories } from '@/modules/finance/finance.actions'
import { toast } from 'sonner'
import Link from 'next/link'

type Category = { id: string; name: string; type: string }

export default function NewTransactionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [type, setType] = useState('EXPENSE')
  const [categoryId, setCategoryId] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      try {
        const data = await getFinanceCategories()
        setCategories(data as Category[])
      } catch {
        toast.error('Error al cargar categorías')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredCategories = categories.filter((c) => c.type === type)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const form = new FormData(e.currentTarget)
      const result = await createTransactionAction(form)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Transacción creada exitosamente')
      router.push('/finances/transactions')
    } catch {
      toast.error('Error al crear la transacción')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Nueva Transacción"
        description="Registra un ingreso o gasto"
        actions={
          <Button variant="outline" render={<Link href="/finances/transactions" />}>
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Transacción</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={(v) => { setType(v ?? 'EXPENSE'); setCategoryId('') }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Gasto</SelectItem>
                  <SelectItem value="INCOME">Ingreso</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="type" value={type} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min={1}
                step="0.01"
                required
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                name="description"
                type="text"
                required
                placeholder="Ej: Compra de insumos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={today}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoría</Label>
              <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input type="hidden" name="categoryId" value={categoryId} />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="isRecurring"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              <Label htmlFor="isRecurring" className="text-sm font-normal">Es recurrente</Label>
              <input type="hidden" name="isRecurring" value={isRecurring ? 'true' : 'false'} />
            </div>

            {isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="recurringDay">Día del mes</Label>
                <Input
                  id="recurringDay"
                  name="recurringDay"
                  type="number"
                  min={1}
                  max={31}
                  defaultValue="1"
                  className="w-24"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notas adicionales (opcional)"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" render={<Link href="/finances/transactions" />}>Cancelar</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar Transacción
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
