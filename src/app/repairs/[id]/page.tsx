import { getRepairById } from '@/modules/repairs/repairs.actions'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Clock, DollarSign, User, Wrench, Package, Pencil, Printer } from 'lucide-react'
import { WhatsAppButton } from '@/components/repair-whatsapp-button'
import Link from 'next/link'
import { formatCurrency } from '@/lib/format'
import { getRepairStatusLabel, getRepairStatusColor } from '@/lib/labels'

interface RepairPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function RepairPage({ params }: RepairPageProps) {
  const { id } = await params
  const repair = await getRepairById(id)

  if (!repair) {
    notFound()
  }

  const partsTotal = repair.repairParts.reduce((sum, p) => sum + p.total, 0)
  const totalCost = repair.laborCost + partsTotal

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
          <div className="flex items-center gap-2">
            <WhatsAppButton repairId={id} phone={repair.client.phone} clientName={repair.client.name} />
            <Link href={`/repairs/${id}/print`}>
              <Button variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir Ficha
              </Button>
            </Link>
            <Link href={`/repairs/${id}/edit`}>
              <Button variant="outline">
                <Pencil className="mr-2 h-4 w-4" />
                Editar Reparación
              </Button>
            </Link>
            <Badge variant="outline" className={getRepairStatusColor(repair.status)}>
              {getRepairStatusLabel(repair.status)}
            </Badge>
          </div>
        </div>

        {/* Repair Details */}
        <Card>
          <CardHeader>
            <CardTitle>Reparación #{repair.id.slice(-6).toUpperCase()}</CardTitle>
            <CardDescription>
              Recibido el {new Date(repair.createdAt).toLocaleDateString('es-CO')} at{' '}
              {new Date(repair.createdAt).toLocaleTimeString('es-CO')}
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

            {/* Parts Used */}
            {repair.repairParts.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Repuestos Utilizados
                </h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-3 py-2 font-medium">Repuesto</th>
                        <th className="text-right px-3 py-2 font-medium">Costo Unit.</th>
                        <th className="text-center px-3 py-2 font-medium w-20">Cant.</th>
                        <th className="text-right px-3 py-2 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repair.repairParts.map((rp) => (
                        <tr key={rp.id} className="border-b last:border-0">
                          <td className="px-3 py-2 font-medium">{rp.part.name}</td>
                          <td className="px-3 py-2 text-right">{formatCurrency(rp.unitCost)}</td>
                          <td className="px-3 py-2 text-center">{rp.quantity}</td>
                          <td className="px-3 py-2 text-right font-semibold">{formatCurrency(rp.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Costos
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Mano de Obra</p>
                  <p className="text-xl font-bold">{formatCurrency(repair.laborCost)}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Repuestos</p>
                  <p className="text-xl font-bold">{formatCurrency(partsTotal)}</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary/10">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(totalCost)}</p>
                </div>
              </div>
            </div>

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
