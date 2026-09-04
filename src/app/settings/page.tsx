'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Building2, FileText, Settings2, Bell, Save, Package } from 'lucide-react'
import { toast } from 'sonner'
import { getSystemSettings, updateSystemSettings } from '@/modules/settings/settings.actions'

interface Settings {
  companyName: string
  companyNit: string | null
  companyAddress: string | null
  companyCity: string | null
  companyPhone: string | null
  companyEmail: string | null
  currency: string
  invoicePrefix: string
  invoiceFooter: string | null
  lowStockThreshold: number
}

const defaultSettings: Settings = {
  companyName: 'Cilmax',
  companyNit: '',
  companyAddress: '',
  companyCity: '',
  companyPhone: '',
  companyEmail: '',
  currency: 'COP',
  invoicePrefix: 'CIL-',
  invoiceFooter: '',
  lowStockThreshold: 5,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const result = await getSystemSettings()
        if (result.success && result.data) {
          const data = result.data as unknown as Settings
          setSettings({ ...defaultSettings, ...data })
        }
      } catch {
        toast.error('Error al cargar configuración')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const formData = new FormData()
      formData.append('companyName', settings.companyName)
      formData.append('companyNit', settings.companyNit || '')
      formData.append('companyAddress', settings.companyAddress || '')
      formData.append('companyCity', settings.companyCity || '')
      formData.append('companyPhone', settings.companyPhone || '')
      formData.append('companyEmail', settings.companyEmail || '')
      formData.append('currency', settings.currency)
      formData.append('invoicePrefix', settings.invoicePrefix)
      formData.append('invoiceFooter', settings.invoiceFooter || '')
      formData.append('lowStockThreshold', String(settings.lowStockThreshold))

      const result = await updateSystemSettings(formData)
      if (result.success) {
        toast.success('Configuración guardada exitosamente')
      } else {
        toast.error(result.error || 'Error al guardar configuración')
      }
    } catch {
      toast.error('Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando configuración...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Configuración de la Tienda</h1>
        <p className="text-muted-foreground">Personaliza los parámetros del sistema</p>
      </div>

      <form onSubmit={handleSave}>
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Empresa
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Factura
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Reglas de Negocio
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notificaciones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
                <CardDescription>Datos que aparecen en facturas y reportes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyNit">NIT / Cédula</Label>
                    <Input
                      id="companyNit"
                      value={settings.companyNit || ''}
                      onChange={(e) => update('companyNit', e.target.value)}
                      placeholder="Ej: 901234567-8"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">Ciudad</Label>
                    <Input
                      id="companyCity"
                      value={settings.companyCity || ''}
                      onChange={(e) => update('companyCity', e.target.value)}
                      placeholder="Ej: Cali"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Dirección</Label>
                  <Input
                    id="companyAddress"
                    value={settings.companyAddress || ''}
                    onChange={(e) => update('companyAddress', e.target.value)}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Teléfono / WhatsApp</Label>
                    <Input
                      id="companyPhone"
                      value={settings.companyPhone || ''}
                      onChange={(e) => update('companyPhone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={settings.companyEmail || ''}
                      onChange={(e) => update('companyEmail', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Moneda</CardTitle>
                <CardDescription>Moneda por defecto para mostrar precios en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <Select
                    value={settings.currency}
                    onValueChange={(value: string | null) => value && update('currency', value)}
                  >
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                      <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuración de Factura</CardTitle>
                <CardDescription>Prefijo y pie de página para las facturas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Prefijo de Factura</Label>
                  <Input
                    id="invoicePrefix"
                    value={settings.invoicePrefix}
                    onChange={(e) => update('invoicePrefix', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Ej: CIL- (genera #CIL-000001)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceFooter">Pie de Página</Label>
                  <Input
                    id="invoiceFooter"
                    value={settings.invoiceFooter || ''}
                    onChange={(e) => update('invoiceFooter', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Texto que aparece al final de la factura
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Reglas de Negocio</CardTitle>
                <CardDescription>Parámetros que afectan el comportamiento del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lowStockThreshold">Alerta de Stock Mínimo</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    min={0}
                    value={settings.lowStockThreshold}
                    onChange={(e) => update('lowStockThreshold', Number(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cantidad mínima de productos antes de mostrar alerta de inventario
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones del Sistema</CardTitle>
                <CardDescription>Eventos que generan notificaciones en la aplicación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <Package className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Stock bajo de productos</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Cuando un producto tiene cantidad menor al umbral definido en Reglas de Negocio
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </form>
    </div>
  )
}
