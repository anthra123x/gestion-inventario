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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { ProductCategory, Supplier } from '@prisma/client'

interface ProductData {
  id: string
  name: string
  description: string | null
  barcode: string | null
  costPrice: number
  salePrice: number
  stock: number
  lowStockThreshold: number
  categoryId: string | null
  supplierId: string | null
  category?: ProductCategory | null
  supplier?: Supplier | null
}

interface ProductFormProps {
  product?: ProductData
  onSubmit: (data: FormData) => Promise<{ error?: string; success?: string }>
  isLoading?: boolean
  redirectTo?: string
  categories?: Array<{ id: string; name: string; color: string | null }>
  suppliers?: Array<{ id: string; name: string }>
}

export function ProductForm({
  product,
  onSubmit,
  isLoading = false,
  redirectTo,
  categories = [],
  suppliers = [],
}: ProductFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState(product?.categoryId || '')
  const [supplierId, setSupplierId] = useState(product?.supplierId || '')

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
          barcode: product.barcode || '',
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          stock: product.stock,
          lowStockThreshold: product.lowStockThreshold,
          categoryId: product.categoryId || '',
          supplierId: product.supplierId || '',
        }
      : {
          name: '',
          description: '',
          barcode: '',
          costPrice: 0,
          salePrice: 0,
          stock: 0,
          lowStockThreshold: 5,
          categoryId: '',
          supplierId: '',
        },
  })

  async function handleFormSubmit(data: Record<string, unknown>) {
    setIsSubmitting(true)
    setError(null)

    try {
      const normalizedData = {
        ...data,
        description: data.description || null,
        barcode: data.barcode || null,
        costPrice: Number(data.costPrice) || 0,
        salePrice: Number(data.salePrice) || 0,
        stock: Number(data.stock) || 0,
        lowStockThreshold: Number(data.lowStockThreshold) || 5,
        categoryId: categoryId || null,
        supplierId: supplierId || null,
      }

      const formData = new FormData()
      Object.entries(normalizedData).forEach(([key, value]) => {
        formData.append(key, String(value))
      })

      const result = await onSubmit(formData)

      if (result?.error) {
        setError(result.error)
        toast.error('Error al guardar producto', {
          description: result.error,
        })
      } else {
        toast.success('Producto guardado exitosamente', {
          description: product ? 'Los cambios se han guardado' : 'El producto ha sido creado',
        })
        if (redirectTo) {
          router.push(redirectTo)
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar producto'
      setError(message)
      toast.error('Error al guardar producto', {
        description: message,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{product ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
        <CardDescription>
          {product ? 'Actualiza los datos del producto' : 'Completa los datos del nuevo producto'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="barcode">Código de barras</Label>
              <Input
                id="barcode"
                {...register('barcode')}
                placeholder="Código de barras"
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descripción del producto..."
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Costo *</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="100"
                {...register('costPrice', { valueAsNumber: true })}
                placeholder="0"
                disabled={isSubmitting || isLoading}
              />
              {errors.costPrice && <p className="text-sm text-red-500">{errors.costPrice.message?.toString()}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio de venta *</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="100"
                {...register('salePrice', { valueAsNumber: true })}
                placeholder="0"
                disabled={isSubmitting || isLoading}
              />
              {errors.salePrice && <p className="text-sm text-red-500">{errors.salePrice.message?.toString()}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                {...register('stock', { valueAsNumber: true })}
                placeholder="0"
                disabled={isSubmitting || isLoading}
              />
              {errors.stock && <p className="text-sm text-red-500">{errors.stock.message?.toString()}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Proveedor</Label>
              <Select value={supplierId} onValueChange={(value) => setSupplierId(value ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar proveedor" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? '')}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Alerta stock bajo</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                {...register('lowStockThreshold', { valueAsNumber: true })}
                placeholder="5"
                disabled={isSubmitting || isLoading}
              />
            </div>
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
