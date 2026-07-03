'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createClient } from '@/modules/clients/clients.actions'

export default function NewClientPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      const result = await createClient(formData)

      if (result?.error) {
        setError(result.error)
        toast.error('Error al crear cliente', { description: result.error })
        setIsLoading(false)
      } else {
        toast.success('Cliente creado exitosamente')
        router.push('/clients')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg)
      toast.error('Error al crear cliente', { description: msg })
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Nuevo Cliente</CardTitle>
          <CardDescription>Registra un nuevo cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" placeholder="Nombre completo" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input id="phone" name="phone" type="tel" placeholder="Ej: 3001234567" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input id="email" name="email" type="email" placeholder="Ej: cliente@email.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección (opcional)</Label>
              <Input id="address" name="address" placeholder="Dirección" />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creando...' : 'Crear Cliente'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push('/clients')}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
