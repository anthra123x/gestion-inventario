'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { getClientById, updateClient } from '@/modules/clients/clients.actions'

export default function EditClientPage() {
  const router = useRouter()
  const { id } = useParams() as { id: string }
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')

  useEffect(() => {
    async function loadClient() {
      try {
        const client = await getClientById(id)
        if (!client) {
          toast.error('Cliente no encontrado')
          router.push('/clients')
          return
        }
        setName(client.name)
        setPhone(client.phone || '')
        setEmail(client.email || '')
        setAddress(client.address || '')
        setIsInitialLoading(false)
      } catch {
        toast.error('Error al cargar cliente')
        setIsInitialLoading(false)
      }
    }
    loadClient()
  }, [id, router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      const result = await updateClient(id, formData)

      if (result?.error) {
        setError(result.error)
        toast.error('Error al actualizar cliente', { description: result.error })
        setIsLoading(false)
      } else {
        toast.success('Cliente actualizado exitosamente')
        router.push(`/clients/${id}`)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      toast.error('Error al actualizar cliente', { description: msg })
      setIsLoading(false)
    }
  }

  if (isInitialLoading) {
    return (
      <div className="container mx-auto py-6 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando datos del cliente...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Editar Cliente</CardTitle>
          <CardDescription>Actualiza los datos del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input id="phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input id="email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección (opcional)</Label>
              <Input id="address" name="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/clients/${id}`)}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
