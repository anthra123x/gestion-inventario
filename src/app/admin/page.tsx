'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Settings, Shield, Trash2, UserPlus } from 'lucide-react'
import { getUsers, updateUserRole, deleteUser, createUserByAdmin } from '@/modules/auth/auth.actions'
import { getSystemSettings, updateSystemSettings } from '@/modules/settings/settings.actions'

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [newUserRole, setNewUserRole] = useState('EMPLOYEE')
  const [settings, setSettings] = useState<any>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)

  useEffect(() => {
    async function loadUsers() {
      try {
        const data = await getUsers()
        setUsers(data)
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setLoading(false)
      }
    }
    loadUsers()

    async function loadSettings() {
      try {
        const data = await getSystemSettings()
        setSettings(data)
      } catch (error) {
        console.error('Error loading settings:', error)
      } finally {
        setSettingsLoading(false)
      }
    }
    loadSettings()
  }, [])

  async function handleUpdateRole(userId: string, role: string) {
    const result = await updateUserRole(userId, role as any)
    if (result.success) {
      const updated = await getUsers()
      setUsers(updated)
    }
  }

  async function handleDeleteUser(userId: string) {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      const result = await deleteUser(userId)
      if (result.success) {
        const updated = await getUsers()
        setUsers(updated)
      }
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()

    const formData = new FormData()
    formData.append('email', newUserEmail)
    formData.append('name', newUserName)
    formData.append('role', newUserRole)

    const result = await createUserByAdmin(formData)

    if (result.success) {
      alert(result.success)
      setNewUserEmail('')
      setNewUserName('')
      setNewUserRole('EMPLOYEE')
      const updated = await getUsers()
      setUsers(updated)
    } else {
      alert(result.error)
    }
  }

  async function handleUpdateSettings(e: React.FormEvent) {
    e.preventDefault()

    const formData = new FormData()
    formData.append('companyName', settings.companyName || '')
    formData.append('companyAddress', settings.companyAddress || '')
    formData.append('companyPhone', settings.companyPhone || '')
    formData.append('companyEmail', settings.companyEmail || '')
    formData.append('defaultMinStock', String(settings.defaultMinStock || 5))
    formData.append('lowStockAlert', String(settings.lowStockAlert || true))
    formData.append('currency', settings.currency || 'COP')
    formData.append('taxRate', String(settings.taxRate || 0))
    formData.append('receiptFooter', settings.receiptFooter || '')

    const result = await updateSystemSettings(formData)

    if (result.success) {
      alert(result.success)
      const updated = await getSystemSettings()
      setSettings(updated)
    } else {
      alert(result.error)
    }
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-gray-600">Configuración y gestión del sistema</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Administrar usuarios y roles del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleUpdateRole(user.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Crear Usuario
            </CardTitle>
            <CardDescription>
              Agregar un nuevo usuario al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newUserName">Nombre</Label>
                <Input
                  id="newUserName"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserEmail">Email</Label>
                <Input
                  id="newUserEmail"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newUserRole">Rol</Label>
                <Select value={newUserRole} onValueChange={(value: string | null) => value && setNewUserRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="EMPLOYEE">Empleado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full">
                Crear Usuario
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              Nota: El usuario recibirá un email para establecer su contraseña
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración del Sistema
            </CardTitle>
            <CardDescription>
              Ajustes generales del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {settingsLoading ? (
              <p className="text-sm text-gray-600">Cargando configuración...</p>
            ) : (
              <form onSubmit={handleUpdateSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings?.companyName || ''}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Dirección</Label>
                  <Input
                    id="companyAddress"
                    value={settings?.companyAddress || ''}
                    onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyPhone">Teléfono</Label>
                  <Input
                    id="companyPhone"
                    value={settings?.companyPhone || ''}
                    onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyEmail">Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings?.companyEmail || ''}
                    onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultMinStock">Stock Mínimo Predeterminado</Label>
                  <Input
                    id="defaultMinStock"
                    type="number"
                    value={settings?.defaultMinStock || 5}
                    onChange={(e) => setSettings({ ...settings, defaultMinStock: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select value={settings?.currency || 'COP'} onValueChange={(value) => setSettings({ ...settings, currency: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                      <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="lowStockAlert"
                    checked={settings?.lowStockAlert || false}
                    onChange={(e) => setSettings({ ...settings, lowStockAlert: e.target.checked })}
                  />
                  <Label htmlFor="lowStockAlert">Alerta de stock bajo</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRate">Tasa de Impuesto (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings?.taxRate || 0}
                    onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receiptFooter">Pie de Página de Recibo</Label>
                  <Input
                    id="receiptFooter"
                    value={settings?.receiptFooter || ''}
                    onChange={(e) => setSettings({ ...settings, receiptFooter: e.target.value })}
                  />
                </div>

                <Button type="submit" className="w-full">
                  Guardar Configuración
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Configuración de seguridad y permisos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Configuración Actual</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Autenticación: Supabase Auth</li>
                  <li>• Roles: ADMIN, EMPLOYEE</li>
                  <li>• Encriptación: SSL/TLS</li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">Recomendaciones</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Cambiar contraseñas periódicamente</li>
                  <li>• No compartir credenciales</li>
                  <li>• Usar contraseñas fuertes</li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-2">Estado del Sistema</h4>
                <p className="text-sm text-green-800">
                  El sistema está configurado con las mejores prácticas de seguridad básicas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
