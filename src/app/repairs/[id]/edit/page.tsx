'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientAutocomplete } from '@/components/forms/client-autocomplete'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/format'
import { editRepair, getRepairById } from '@/modules/repairs/repairs.actions'
import { getProducts } from '@/modules/inventory/inventory.actions'

type Part = Awaited<ReturnType<typeof getProducts>>['products'][number]

interface RepairPart {
  partId: string
  quantity: number
  unitCost: number
}

export default function EditRepairPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [parts, setParts] = useState<Part[]>([])
  const [selectedParts, setSelectedParts] = useState<RepairPart[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [laborCost, setLaborCost] = useState<number>(0)
  const [currentStatus, setCurrentStatus] = useState<string>('')

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [device, setDevice] = useState('')
  const [problem, setProblem] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [estimatedDate, setEstimatedDate] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [repairData, partsData] = await Promise.all([
          getRepairById(id),
          getProducts(undefined, 1, 1000),
        ])

        if (!repairData) {
          toast.error('Reparación no encontrada')
          router.push('/repairs')
          return
        }

        setParts(partsData.products)

        setClientName(repairData.client.name || '')
        setClientPhone(repairData.client.phone || '')
        setClientEmail(repairData.client.email || '')
        setClientAddress(repairData.client.address || '')
        setDevice(repairData.device || '')
        setProblem(repairData.problem || '')
        setDiagnosis(repairData.diagnosis || '')
        setNotes(repairData.notes || '')
        setInternalNotes(repairData.internalNotes || '')
        setEstimatedDate(repairData.estimatedDate ? new Date(repairData.estimatedDate).toISOString().split('T')[0] : '')
        setCurrentStatus(repairData.status)
        setLaborCost(repairData.laborCost)

        const existingParts: RepairPart[] = repairData.repairParts.map((rp) => ({
          partId: rp.partId,
          quantity: rp.quantity,
          unitCost: rp.unitCost,
        }))
        setSelectedParts(existingParts)

        setIsInitialLoading(false)
      } catch {
        toast.error('Error al cargar datos', {
          description: 'No se pudieron cargar los datos de la reparación',
        })
        setIsInitialLoading(false)
      }
    }
    loadData()
  }, [id, router])

  const partsCost = useMemo(() => {
    return selectedParts.reduce((sum, item) => {
      const part = parts.find((p) => p.id === item.partId)
      return sum + (part?.price || 0) * item.quantity
    }, 0)
  }, [selectedParts, parts])

  const totalCost = laborCost + partsCost

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
      const formData = new FormData()

      formData.set('clientName', clientName)
      formData.set('clientPhone', clientPhone)
      formData.set('clientEmail', clientEmail)
      formData.set('clientAddress', clientAddress)
      formData.set('device', device)
      formData.set('problem', problem)

      if (diagnosis) formData.set('diagnosis', diagnosis)
      if (notes) formData.set('notes', notes)
      if (internalNotes) formData.set('internalNotes', internalNotes)
      if (estimatedDate) formData.set('estimatedDate', estimatedDate)
      if (currentStatus) formData.set('status', currentStatus)

      formData.set('laborCost', (Number(laborCost) || 0).toString())
      formData.append('parts', JSON.stringify(selectedParts))

      const result = await editRepair(id, formData)

      if (result?.error) {
        setError(result.error)
        toast.error('Error al actualizar reparación', {
          description: result.error,
        })
        setIsLoading(false)
      } else {
        toast.success('Reparación actualizada', {
          description: 'Los cambios han sido guardados exitosamente',
        })
        router.push(`/repairs/${id}`)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast.error('Error al actualizar reparación', {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  function addPart(partId: string) {
    const part = parts.find((p) => p.id === partId)
    if (part) {
      const existingIndex = selectedParts.findIndex((p) => p.partId === partId)
      if (existingIndex >= 0) {
        const updated = [...selectedParts]
        updated[existingIndex].quantity += 1
        setSelectedParts(updated)
      } else {
        setSelectedParts([...selectedParts, { partId, quantity: 1, unitCost: part.price }])
      }
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

  if (isInitialLoading) {
    return (
      <div className="container mx-auto py-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando datos de la reparación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 min-h-screen space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Editar Reparación</h1>
        <p className="text-gray-600">Modificar los detalles de la orden de trabajo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Reparación</CardTitle>
          <CardDescription>Edita los detalles de la reparación</CardDescription>
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
                  <Input
                    id="device"
                    name="device"
                    placeholder="Ej: iPhone 11, Samsung S21"
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="problem">Problema Reportado</Label>
                  <Textarea
                    id="problem"
                    name="problem"
                    placeholder="Describe el problema del dispositivo"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diagnosis">Diagnóstico</Label>
                  <Textarea
                    id="diagnosis"
                    name="diagnosis"
                    placeholder="Diagnóstico del técnico"
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                  />
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
                  <Input
                    id="estimatedDate"
                    name="estimatedDate"
                    type="date"
                    value={estimatedDate}
                    onChange={(e) => setEstimatedDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={currentStatus}
                    onValueChange={(value: string | null) => value && setCurrentStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEIVED">Recibido</SelectItem>
                      <SelectItem value="IN_PROGRESS">En Progreso</SelectItem>
                      <SelectItem value="READY">Listo</SelectItem>
                      <SelectItem value="DELIVERED">Entregado</SelectItem>
                      <SelectItem value="CANCELLED">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalNotes">Notas Internas</Label>
              <Textarea
                id="internalNotes"
                name="internalNotes"
                placeholder="Notas solo visibles para el equipo técnico"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas para el Cliente</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Notas visibles para el cliente"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
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
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/repairs/${id}`)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
