'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateProductSchema, UpdateProductSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Product, ProductCategory } from '@prisma/client'

interface ProductFormProps {
  product?: Product
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
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(product ? UpdateProductSchema : CreateProductSchema),
    defaultValues: product
      ? {
          name: product.name,
          description: product.description || '',
          category: product.category,
          stock: product.stock,
          minStock: product.minStock,
          purchasePrice: product.purchasePrice,
          salePrice: product.salePrice,
          supplier: product.supplier || '',
        }
      : {
          name: '',
          description: '',
          category: 'ACCESSORY' as ProductCategory,
          stock: 0,
          minStock: 5,
          purchasePrice: 0,
          salePrice: 0,
          supplier: '',
        },
  })

  const selectedCategory = watch('category')

  const _formatPrice = (value: number) => {
    return new Intl.NumberFormat('es-CO').format(value)
  }

  const handlePriceChange = (value: string, fieldName: 'purchasePrice' | 'salePrice') => {
    const numericValue = parseFloat(value.replace(/\./g, '').replace(/,/g, ''))
    setValue(fieldName, numericValue || 0)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function handleFormSubmit(data: any) {
    setIsSubmitting(true)
    setError(null)

    try {
      const normalizedData = {
        ...data,
        description: data.description || null,
        supplier: data.supplier || null,
        stock: Number(data.stock) || 0,
        minStock: Number(data.minStock) || 0,
        purchasePrice: Number(data.purchasePrice) || 0,
        salePrice: Number(data.salePrice) || 0,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || 'Error al guardar producto')
      toast.error('Error al guardar producto', {
        description: err?.message || 'Error desconocido',
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
              placeholder="Descripción del producto..."
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoría *</Label>
            <Select
              value={selectedCategory}
              onValueChange={(value) => setValue('category', value as ProductCategory)}
              disabled={isSubmitting || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACCESSORY">Accesorio</SelectItem>
                <SelectItem value="REPAIR_PART">Repuesto</SelectItem>
                <SelectItem value="DEVICE">Dispositivo</SelectItem>
                <SelectItem value="OTHER">Otro</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-red-500">{errors.category.message?.toString()}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Proveedor (opcional)</Label>
            <Input
              id="supplier"
              {...register('supplier')}
              placeholder="Ej: Distribuidora Tech"
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">Stock Actual *</Label>
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

          <div className="space-y-2">
            <Label htmlFor="minStock">Stock Mínimo *</Label>
            <Input
              id="minStock"
              type="number"
              min="0"
              {...register('minStock', { valueAsNumber: true })}
              placeholder="5"
              disabled={isSubmitting || isLoading}
            />
            {errors.minStock && <p className="text-sm text-red-500">{errors.minStock.message?.toString()}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Precio de Compra *</Label>
            <Input
              id="purchasePrice"
              type="text"
              {...register('purchasePrice')}
              placeholder="0"
              disabled={isSubmitting || isLoading}
              onChange={(e) => handlePriceChange(e.target.value, 'purchasePrice')}
            />
            {errors.purchasePrice && <p className="text-sm text-red-500">{errors.purchasePrice.message?.toString()}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="salePrice">Precio de Venta *</Label>
            <Input
              id="salePrice"
              type="text"
              {...register('salePrice')}
              placeholder="0"
              disabled={isSubmitting || isLoading}
              onChange={(e) => handlePriceChange(e.target.value, 'salePrice')}
            />
            {errors.salePrice && <p className="text-sm text-red-500">{errors.salePrice.message?.toString()}</p>}
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
