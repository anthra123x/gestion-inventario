'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateProductSchema, UpdateProductSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface PartData {
  id: string
  name: string
  description: string | null
  supplier: string | null
  price: number
}

interface ProductFormProps {
  product?: PartData
  onSubmit: (data: FormData) => Promise<{ error?: string; success?: string }>
  isLoading?: boolean
  redirectTo?: string
}

export function ProductForm({ product, onSubmit, isLoading = false, redirectTo }: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(product ? UpdateProductSchema : CreateProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || '',
          supplier: product.supplier || '',
          price: product.price,
        }
      : {
          name: '',
          description: '',
          supplier: '',
          price: 0,
        },
  })

  async function handleFormSubmit(data: Record<string, unknown>) {
    setIsSubmitting(true)
    setError(null)

    try {
      const normalizedData = {
        ...data,
        description: data.description || null,
        supplier: data.supplier || null,
        price: Number(data.price) || 0,
      }

      const formData = new FormData()
      Object.entries(normalizedData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      const result = await onSubmit(formData)

      if (result?.error) {
        setError(result.error)
        toast.error('Error al guardar repuesto', {
          description: result.error,
        })
      } else {
        toast.success('Repuesto guardado exitosamente', {
          description: product ? 'Los cambios se han guardado' : 'El repuesto ha sido creado',
        })
        if (redirectTo) {
          router.push(redirectTo)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar repuesto'
      setError(message)
      toast.error('Error al guardar repuesto', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{product ? 'Editar Repuesto' : 'Nuevo Repuesto'}</CardTitle>
        <CardDescription>
          {product ? 'Actualiza los datos del repuesto' : 'Completa los datos del nuevo repuesto'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Ej: Cable USB Tipo C"
              disabled={isSubmitting || isLoading}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descripción del repuesto..."
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor (opcional)</Label>
            <Input
              id="supplier"
              {...register('supplier')}
              placeholder="Nombre del proveedor"
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Precio de Referencia *</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="100"
              {...register('price', { valueAsNumber: true })}
              placeholder="0"
              disabled={isSubmitting || isLoading}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price.message?.toString()}</p>}
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
