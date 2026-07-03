import { getClientById } from '@/modules/clients/clients.actions'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, Phone, Mail, MapPin, Wrench } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { getRepairStatusLabel, getRepairStatusColor } from '@/lib/labels'

interface ClientPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params
  const client = await getClientById(id)

  if (!client) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6 min-h-screen space-y-6">
      <div className="flex justify-between items-center">
        <Link href="/clients">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <Link href={`/clients/${id}/edit`}>
          <Button variant="outline">
            <Pencil className="mr-2 h-4 w-4" />
            Editar Cliente
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{client.name}</CardTitle>
          <CardDescription>Información del cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{client.email}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-center gap-2 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{client.address}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wrench className="h-5 w-5" />
            Historial de Reparaciones
          </CardTitle>
          <CardDescription>{client.repairs.length} reparaciones registradas</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {client.repairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Este cliente no tiene reparaciones registradas
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">#</th>
                    <th className="text-left px-4 py-3 font-medium">Dispositivo</th>
                    <th className="text-left px-4 py-3 font-medium">Estado</th>
                    <th className="text-right px-4 py-3 font-medium">Total</th>
                    <th className="text-right px-4 py-3 font-medium">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {client.repairs.map((repair) => {
                    const partsTotal = repair.repairParts.reduce((sum, p) => sum + p.total, 0)
                    const totalCost = repair.laborCost + partsTotal
                    return (
                      <tr key={repair.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs">
                          <Link href={`/repairs/${repair.id}`} className="text-primary hover:underline">
                            #{repair.id.slice(-6).toUpperCase()}
                          </Link>
                        </td>
                        <td className="px-4 py-3 font-medium">{repair.device}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={getRepairStatusColor(repair.status)}>
                            {getRepairStatusLabel(repair.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(totalCost)}</td>
                        <td className="px-4 py-3 text-right text-muted-foreground">
                          {new Date(repair.createdAt).toLocaleDateString('es-CO')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
