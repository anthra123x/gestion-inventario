'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { createRepair } from '@/modules/repairs/repairs.actions'
import { getProducts } from '@/modules/inventory/inventory.actions'
import { ProductCategory } from '@prisma/client'

export default function NewRepairPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [cost, setCost] = useState<number>(0)

  useEffect(() => {
    async function loadProducts() {
      try {
        const productsData = await getProducts(undefined, ProductCategory.REPAIR_PART, 1, 100)
        setProducts(productsData.products)
      } catch (err) {
        toast.error('Error al cargar productos', {
          description: 'No se pudieron cargar los productos disponibles',
        })
      }
    }
    loadProducts()
  }, [])

  const partsCost = useMemo(() => {
    return selectedProducts.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId)
      return sum + ((product?.purchasePrice || 0) * item.quantity)
    }, 0)
  }, [selectedProducts, products])

  const estimatedProfit = cost - partsCost

  const hasLoss = cost > 0 && partsCost > cost

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (hasLoss) {
      toast.error('No se puede crear la reparación', {
        description: 'El costo estimado es menor al costo de los repuestos. Se produciría una pérdida.',
      })
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)

      const diagnosis = formData.get('diagnosis') as string
      if (diagnosis === '') formData.set('diagnosis', '')

      formData.set('cost', (Number(cost) || 0).toString())

      const notes = formData.get('clientNotes') as string
      if (notes === '') formData.set('clientNotes', '')

      const internalNotes = formData.get('internalNotes') as string
      if (internalNotes === '') formData.set('internalNotes', '')

      const estimatedDate = formData.get('estimatedDate') as string
      if (estimatedDate === '') formData.delete('estimatedDate')

      formData.append('parts', JSON.stringify(selectedProducts))

      const result = await createRepair(formData)

      if (result?.error) {
        setError(result.error)
        toast.error('Error al crear reparación', {
          description: result.error,
        })
        setIsLoading(false)
      } else {
        toast.success('Reparación creada exitosamente', {
          description: 'La orden de trabajo ha sido creada',
        })
        router.push('/repairs')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast.error('Error al crear reparación', {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  function addProduct(productId: string) {
    const product = products.find(p => p.id === productId)
    if (product) {
      setSelectedProducts([...selectedProducts, { productId, quantity: 1 }])
    }
  }

  function removeProduct(index: number) {
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index))
  }

  function updateProductQuantity(index: number, quantity: number) {
    const updated = [...selectedProducts]
    updated[index].quantity = quantity
    setSelectedProducts(updated)
  }

  return (
    <div className="container mx-auto py-6 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nueva Reparación</h1>
        <p className="text-gray-600">Crear una nueva orden de trabajo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Reparación</CardTitle>
          <CardDescription>Completa los detalles de la reparación</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datos del Cliente</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nombre del Cliente *</Label>
                  <Input
                    id="clientName"
                    name="clientName"
                    placeholder="Nombre completo del cliente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Teléfono *</Label>
                  <Input
                    id="clientPhone"
                    name="clientPhone"
                    type="tel"
                    placeholder="Ej: 300 123 4567"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientEmail">Email (Opcional)</Label>
                  <Input
                    id="clientEmail"
                    name="clientEmail"
                    type="email"
                    placeholder="Ej: cliente@email.com"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clientAddress">Dirección (Opcional)</Label>
                  <Input
                    id="clientAddress"
                    name="clientAddress"
                    placeholder="Dirección del cliente"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Datos del Dispositivo</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="device">Dispositivo</Label>
                  <Input
                    id="device"
                    name="device"
                    placeholder="Ej: iPhone 11, Samsung S21"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Problema Reportado</Label>
                  <Textarea
                    id="problem"
                    name="problem"
                    placeholder="Describe el problema del dispositivo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cost">Costo Estimado / Mano de Obra (COP)</Label>
                  <Input
                    id="cost"
                    name="cost"
                    type="number"
                    step="100"
                    placeholder="Ej: 50000"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDate">Fecha Estimada de Entrega</Label>
                  <Input
                    id="estimatedDate"
                    name="estimatedDate"
                    type="date"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalNotes">Notas Internas</Label>
              <Textarea
                id="internalNotes"
                name="internalNotes"
                placeholder="Notas solo visibles para el equipo técnico"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientNotes">Notas para el Cliente</Label>
              <Textarea
                id="clientNotes"
                name="clientNotes"
                placeholder="Notas visibles para el cliente"
              />
            </div>

            <div className="space-y-2">
              <Label>Repuestos</Label>
              <Select onValueChange={(value: string | null) => value && addProduct(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Agregar repuesto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} — {formatCurrency(product.salePrice)} (Stock: {product.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedProducts.length > 0 && (
                <div className="space-y-2 mt-2">
                  {selectedProducts.map((item, index) => {
                    const product = products.find(p => p.id === item.productId)
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <span className="flex-1">{product?.name}</span>
                        <span className="text-sm text-gray-500">
                          Costo: {formatCurrency(product?.purchasePrice || 0)}
                        </span>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(index, parseInt(e.target.value))}
                          className="w-20"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeProduct(index)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Profit Summary */}
            <Card className={hasLoss ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-3">Resumen de Rentabilidad</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo repuestos:</span>
                    <span className="font-medium">{formatCurrency(partsCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mano de obra:</span>
                    <span className="font-medium">{formatCurrency(cost)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-semibold">Ganancia estimada:</span>
                    <span className={`font-bold text-lg ${hasLoss ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(estimatedProfit)}
                    </span>
                  </div>
                  {hasLoss && (
                    <div className="text-red-600 text-xs mt-2 font-medium">
                      ⚠️ Esta reparación generaría una pérdida. Ajusta el costo estimado o reduce los repuestos.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading || hasLoss}>
                {isLoading ? 'Creando...' : 'Crear Reparación'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/repairs')}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
