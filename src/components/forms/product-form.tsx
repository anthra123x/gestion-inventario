'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateProductSchema, UpdateProductSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Product, ProductCategory } from '@prisma/client'

interface ProductFormProps {
  product?: Product
  onSubmit: (data: FormData) => Promise<{ error?: string; success?: string }>
  isLoading?: boolean
}

export function ProductForm({ product, onSubmit, isLoading = false }: ProductFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(product ? UpdateProductSchema : CreateProductSchema),
    defaultValues: product ? {
      name: product.name,
      description: product.description || '',
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      supplier: product.supplier || '',
      barcode: product.barcode || '',
    } : {
      name: '',
      description: '',
      category: 'ACCESSORY' as ProductCategory,
      stock: 0,
      minStock: 5,
      purchasePrice: 0,
      salePrice: 0,
      supplier: '',
      barcode: '',
    }
  })

  const selectedCategory = watch('category')

  async function handleFormSubmit(data: any) {
    setIsSubmitting(true)
    
    const formData = new FormData()
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key].toString())
      }
    })

    const result = await onSubmit(formData)
    
    if (result?.error) {
      // Handle error (you might want to show this in the UI)
      console.error(result.error)
    }
    
    setIsSubmitting(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? 'Editar Producto' : 'Nuevo Producto'}</CardTitle>
        <CardDescription>
          {product ? 'Modifica los datos del producto' : 'Completa los datos para agregar un nuevo producto'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Producto *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ej: Pantalla iPhone 12"
                disabled={isSubmitting || isLoading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>
              )}
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
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                {...register('barcode')}
                placeholder="Ej: 1234567890123"
                disabled={isSubmitting || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Proveedor</Label>
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
              {errors.stock && (
                <p className="text-sm text-red-500">{errors.stock.message?.toString()}</p>
              )}
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
              {errors.minStock && (
                <p className="text-sm text-red-500">{errors.minStock.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Precio de Compra *</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                {...register('purchasePrice', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={isSubmitting || isLoading}
              />
              {errors.purchasePrice && (
                <p className="text-sm text-red-500">{errors.purchasePrice.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">Precio de Venta *</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                min="0"
                {...register('salePrice', { valueAsNumber: true })}
                placeholder="0.00"
                disabled={isSubmitting || isLoading}
              />
              {errors.salePrice && (
                <p className="text-sm text-red-500">{errors.salePrice.message?.toString()}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Describe el producto..."
              rows={3}
              disabled={isSubmitting || isLoading}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting || isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
              {isSubmitting ? 'Guardando...' : product ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
