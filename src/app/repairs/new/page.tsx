'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ClientAutocomplete } from '@/components/forms/client-autocomplete'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { createRepair } from '@/modules/repairs/repairs.actions'
import { getProducts } from '@/modules/inventory/inventory.actions'


export default function NewRepairPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [cost, setCost] = useState<number>(0)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        const productsData = await getProducts(undefined, undefined, 1, 1000)
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

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    const term = searchTerm.toLowerCase()
    return products.filter(
      p => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)
    )
  }, [searchTerm, products])

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

  function handleClientSelect(client: { name: string; phone: string; email: string | null; address: string | null }) {
    setClientName(client.name)
    setClientPhone(client.phone)
    setClientEmail(client.email || '')
    setClientAddress(client.address || '')
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
                  <ClientAutocomplete
                    value={clientName}
                    onChange={setClientName}
                    onSelect={handleClientSelect}
                    placeholder="Nombre completo del cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Teléfono *</Label>
                  <Input
                    id="clientPhone"
                    name="clientPhone"
                    type="tel"
                    placeholder="Ej: 300 123 4567"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
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
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="clientAddress">Dirección (Opcional)</Label>
                  <Input
                    id="clientAddress"
                    name="clientAddress"
                    placeholder="Dirección del cliente"
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
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

            <div className="space-y-4">
              <Label>Repuestos</Label>

              {/* Buscador de productos */}
              <Input
                placeholder="Buscar producto por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Resultados de búsqueda */}
              {searchTerm && (
                <Card>
                  <CardContent className="p-1 max-h-64 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3">
                        No se encontraron productos
                      </p>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredProducts.map((product) => {
                          const alreadyAdded = selectedProducts.some(
                            (p) => p.productId === product.id
                          )
                          return (
                            <button
                              key={product.id}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => {
                                addProduct(product.id)
                                setSearchTerm('')
                              }}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-left transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(product.salePrice)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge
                                  variant={
                                    product.stock === 0
                                      ? 'destructive'
                                      : product.stock <= 3
                                        ? 'warning'
                                        : 'default'
                                  }
                                >
                                  {product.stock} uds.
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Costo: {formatCurrency(product.purchasePrice || 0)}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Lista de repuestos seleccionados */}
              {selectedProducts.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium">Producto</th>
                        <th className="text-right px-3 py-2 font-medium">Costo unit.</th>
                        <th className="text-center px-3 py-2 font-medium w-24">Cant.</th>
                        <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                        <th className="w-10 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProducts.map((item, index) => {
                        const product = products.find(p => p.id === item.productId)
                        const subtotal = (product?.purchasePrice || 0) * item.quantity
                        return (
                          <tr key={index} className="border-b last:border-0">
                            <td className="px-3 py-2">
                              <p className="font-medium truncate max-w-48">
                                {product?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Stock: {product?.stock ?? 0}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-right">
                              {formatCurrency(product?.purchasePrice || 0)}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value)
                                  if (val > 0) updateProductQuantity(index, val)
                                }}
                                className="w-20 h-8 mx-auto text-center"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {formatCurrency(subtotal)}
                            </td>
                            <td className="px-2 py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeProduct(index)}
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
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
