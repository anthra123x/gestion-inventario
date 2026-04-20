import { getRepairById } from '@/modules/repairs/repairs.actions'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, DollarSign, User, Phone, Mail, MapPin, Wrench, Package } from 'lucide-react'
import Link from 'next/link'

interface RepairPageProps {
  params: Promise<{
    id: string
  }>
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO').format(value)
}

function getRepairStatusColor(status: string): string {
  const colors: Record<string, string> = {
    RECEIVED: 'bg-blue-100 text-blue-800 border-blue-200',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    READY: 'bg-green-100 text-green-800 border-green-200',
    DELIVERED: 'bg-purple-100 text-purple-800 border-purple-200',
    CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  }
  return colors[status] || 'default'
}

function getRepairStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    RECEIVED: 'Recibido',
    IN_PROGRESS: 'En Progreso',
    READY: 'Listo',
    DELIVERED: 'Entregado',
    CANCELLED: 'Cancelado',
  }
  return labels[status] || status
}

export default async function RepairPage({ params }: RepairPageProps) {
  const { id } = await params
  const repair = await getRepairById(id)

  if (!repair) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Link href="/repairs">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <Badge variant="outline" className={getRepairStatusColor(repair.status)}>
            {getRepairStatusLabel(repair.status)}
          </Badge>
        </div>

        {/* Repair Details */}
        <Card>
          <CardHeader>
            <CardTitle>Reparación #{repair.id.slice(-6).toUpperCase()}</CardTitle>
            <CardDescription>
              Recibido el {new Date(repair.createdAt).toLocaleDateString('es-CO')} at {new Date(repair.createdAt).toLocaleTimeString('es-CO')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Device Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Información del Dispositivo
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Dispositivo</p>
                  <p className="font-medium">{repair.device}</p>
                </div>
              </div>
            </div>

            {/* Client Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{repair.client.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="font-medium">{repair.client.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{repair.client.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Dirección</p>
                  <p className="font-medium">{repair.client.address || '-'}</p>
                </div>
              </div>
            </div>

            {/* Problem Description */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Descripción del Problema
              </h3>
              <p className="text-gray-600">{repair.problem}</p>
            </div>

            {/* Diagnosis */}
            {repair.diagnosis && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Diagnóstico
                </h3>
                <p className="text-gray-600">{repair.diagnosis}</p>
              </div>
            )}

            {/* Cost */}
            {repair.cost !== null && repair.cost !== undefined && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Costo
                </h3>
                <p className="text-2xl font-bold">${formatCOP(repair.cost)} COP</p>
              </div>
            )}

            {/* Notes */}
            {repair.notes && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Notas</h3>
                <p className="text-gray-600">{repair.notes}</p>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Fecha de Recepción</p>
                  <p className="font-medium">{new Date(repair.dateReceived).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
              {repair.dateDelivered && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Entrega</p>
                    <p className="font-medium">{new Date(repair.dateDelivered).toLocaleDateString('es-CO')}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
