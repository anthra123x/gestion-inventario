'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ClientAutocomplete } from '@/components/forms/client-autocomplete'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { createRepair } from '@/modules/repairs/repairs.actions'
import { getProducts } from '@/modules/inventory/inventory.actions'

type Part = Awaited<ReturnType<typeof getProducts>>['products'][number]
interface SelectedPart {
  partId: string
  quantity: number
  unitCost: number
}

export default function NewRepairPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [parts, setParts] = useState<Part[]>([])
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [laborCost, setLaborCost] = useState<number>(0)
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')

  useEffect(() => {
    async function loadParts() {
      try {
        const partsData = await getProducts(undefined, 1, 1000)
        setParts(partsData.products)
      } catch {
        toast.error('Error al cargar repuestos', {
          description: 'No se pudieron cargar los repuestos disponibles',
        })
      }
    }
    loadParts()
  }, [])

  const partsCost = useMemo(() => {
    return selectedParts.reduce((sum, item) => {
      const part = parts.find((p) => p.id === item.partId)
      return sum + (part?.price || 0) * item.quantity
    }, 0)
  }, [selectedParts, parts])

  const totalCost = laborCost + partsCost

  const filteredParts = useMemo(() => {
    if (!searchTerm) return parts
    const term = searchTerm.toLowerCase()
    return parts.filter((p) => p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term))
  }, [searchTerm, parts])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)

      const diagnosis = formData.get('diagnosis') as string
      if (diagnosis === '') formData.set('diagnosis', '')

      formData.set('laborCost', (Number(laborCost) || 0).toString())

      const notes = formData.get('clientNotes') as string
      if (notes === '') formData.set('clientNotes', '')

      const internalNotes = formData.get('internalNotes') as string
      if (internalNotes === '') formData.set('internalNotes', '')

      const estimatedDate = formData.get('estimatedDate') as string
      if (estimatedDate === '') formData.delete('estimatedDate')

      formData.append('parts', JSON.stringify(selectedParts))

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

  function handleClientSelect(client: {
    name: string
    phone: string | null
    email: string | null
    address: string | null
  }) {
    setClientName(client.name)
    setClientPhone(client.phone || '')
    setClientEmail(client.email || '')
    setClientAddress(client.address || '')
  }

  function addPart(partId: string) {
    const part = parts.find((p) => p.id === partId)
    if (part) {
      setSelectedParts([...selectedParts, { partId, quantity: 1, unitCost: part.price }])
    }
  }

  function removePart(index: number) {
    setSelectedParts(selectedParts.filter((_, i) => i !== index))
  }

  function updatePartQuantity(index: number, quantity: number) {
    const updated = [...selectedParts]
    updated[index].quantity = quantity
    setSelectedParts(updated)
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
                  <Label htmlFor="clientName">Nombre del Cliente</Label>
                  <ClientAutocomplete
                    name="clientName"
                    value={clientName}
                    onChange={setClientName}
                    onSelect={handleClientSelect}
                    placeholder="Nombre completo del cliente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientPhone">Teléfono (Opcional)</Label>
                  <Input
                    id="clientPhone"
                    name="clientPhone"
                    type="tel"
                    placeholder="Ej: 300 123 4567"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
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
                  <Input id="device" name="device" placeholder="Ej: iPhone 11, Samsung S21" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Problema Reportado</Label>
                  <Textarea id="problem" name="problem" placeholder="Describe el problema del dispositivo" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="laborCost">Mano de Obra (COP)</Label>
                  <Input
                    id="laborCost"
                    name="laborCost"
                    type="number"
                    step="100"
                    placeholder="Ej: 50000"
                    value={laborCost}
                    onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDate">Fecha Estimada de Entrega</Label>
                  <Input id="estimatedDate" name="estimatedDate" type="date" />
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
              <Textarea id="clientNotes" name="clientNotes" placeholder="Notas visibles para el cliente" />
            </div>

            <div className="space-y-4">
              <Label>Repuestos</Label>

              <Input
                placeholder="Buscar repuesto por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {searchTerm && (
                <Card>
                  <CardContent className="p-1 max-h-64 overflow-y-auto">
                    {filteredParts.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3">No se encontraron repuestos</p>
                    ) : (
                      <div className="space-y-0.5">
                        {filteredParts.map((part) => {
                          const alreadyAdded = selectedParts.some((p) => p.partId === part.id)
                          return (
                            <button
                              key={part.id}
                              type="button"
                              disabled={alreadyAdded}
                              onClick={() => {
                                addPart(part.id)
                                setSearchTerm('')
                              }}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-left transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">{part.name}</p>
                                {part.description && (
                                  <p className="text-xs text-muted-foreground truncate">{part.description}</p>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatCurrency(part.price)}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {selectedParts.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium">Repuesto</th>
                        <th className="text-right px-3 py-2 font-medium">Costo unit.</th>
                        <th className="text-center px-3 py-2 font-medium w-24">Cant.</th>
                        <th className="text-right px-3 py-2 font-medium">Subtotal</th>
                        <th className="w-10 px-2 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedParts.map((item, index) => {
                        const part = parts.find((p) => p.id === item.partId)
                        const subtotal = (part?.price || 0) * item.quantity
                        return (
                          <tr key={index} className="border-b last:border-0">
                            <td className="px-3 py-2">
                              <p className="font-medium truncate max-w-48">{part?.name}</p>
                            </td>
                            <td className="px-3 py-2 text-right">{formatCurrency(part?.price || 0)}</td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value)
                                  if (val > 0) updatePartQuantity(index, val)
                                }}
                                className="w-20 h-8 mx-auto text-center"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">{formatCurrency(subtotal)}</td>
                            <td className="px-2 py-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removePart(index)}
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

            {selectedParts.length > 0 && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4">
                  <h4 className="font-semibold mb-2">Resumen</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Repuestos:</span>
                      <span className="font-medium">{formatCurrency(partsCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mano de obra:</span>
                      <span className="font-medium">{formatCurrency(laborCost)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">{formatCurrency(totalCost)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Reparación'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/repairs')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
