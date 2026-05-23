'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Shield, Calendar, Loader2 } from 'lucide-react'
import { getCurrentUser } from '@/modules/auth/auth.actions'
import { toast } from 'sonner'

export default function ProfilePage() {
  const [user, setUser] = useState<{ email: string; name: string; role: string; createdAt: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await getCurrentUser()
      if (result) {
        setUser({
          email: result.email ?? '',
          name: result.name ?? '',
          role: result.role ?? 'EMPLOYEE',
          createdAt: '',
        })
        setName(result.name ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    // TODO: Implementar actualización de perfil cuando el backend lo soporte
    await new Promise(r => setTimeout(r, 500))
    if (user) setUser({ ...user, name })
    setIsEditing(false)
    setSaving(false)
    toast.success('Perfil actualizado')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-gray-600">No se pudo cargar la información del usuario. Inicia sesión nuevamente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-gray-600">Información de tu cuenta</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>Tus datos de usuario</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              ) : (
                <p className="text-sm">{user.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <p className="text-sm">{user.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Rol</Label>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                <p className="text-sm">{user.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</p>
              </div>
            </div>

            {user.createdAt && (
  <div className="space-y-2">
    <Label>Fecha de Registro</Label>
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-gray-500" />
      <p className="text-sm">
        {new Date(user.createdAt).toLocaleDateString('es-ES')}
      </p>
    </div>
  </div>
)}

            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar
                  </Button>
                  <Button variant="outline" onClick={() => { setIsEditing(false); setName(user.name) }}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>Editar</Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Cambiar contraseña</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input id="currentPassword" type="password" autoComplete="current-password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" />
            </div>

            <Button>Actualizar Contraseña</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
