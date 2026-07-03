'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Edit, Trash2, Users, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { SearchInput } from '@/components/ui/search-input'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'

import { toast } from 'sonner'
import { getClients, deleteClient } from '@/modules/clients/clients.actions'

interface Client {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  createdAt: Date
  _count: { repairs: number }
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    loadClients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  async function loadClients() {
    try {
      setLoading(true)
      const data = await getClients(debouncedSearch || undefined)
      setClients(data as unknown as Client[])
    } catch (_error) {
      console.error('Error loading clients:', _error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteClient(client: Client) {
    try {
      const result = await deleteClient(client.id)

      if (result?.error) {
        toast.error(result.error)
        return
      }

      if (result?.success) {
        toast.success('Cliente eliminado')
        await loadClients()
        setDeleteDialogOpen(false)
        setClientToDelete(null)
      }
    } catch {
      toast.error('Error al eliminar el cliente')
    }
  }

  if (loading && clients.length === 0) {
    return (
      <div className="page-container py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-40 mb-2" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona tus clientes"
        actions={
          <Link href="/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </Link>
        }
      />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar clientes..." />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Reparaciones</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="font-medium">{client.name}</div>
                    </TableCell>
                    <TableCell>{client.phone}</TableCell>
                    <TableCell className="text-muted-foreground">{client.email || '—'}</TableCell>
                    <TableCell className="text-center">{client._count?.repairs || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/clients/${client.id}`}>
                          <Button variant="ghost" size="icon-sm" aria-label="Ver cliente">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/clients/${client.id}/edit`}>
                          <Button variant="ghost" size="icon-sm" aria-label="Editar cliente">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label="Eliminar cliente"
                          onClick={() => {
                            setClientToDelete(client)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {clients.length === 0 && (
            <EmptyState
              icon={Users}
              title={search ? 'Sin resultados' : 'Sin clientes'}
              description={
                search
                  ? 'No hay clientes que coincidan con tu búsqueda'
                  : 'Crea tu primer cliente para comenzar'
              }
              action={
                search ? undefined : { label: 'Crear cliente', href: '/clients/new' }
              }
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <DialogTitle className="text-center">¿Eliminar cliente?</DialogTitle>
            <DialogDescription className="text-center">
              ¿Estás seguro de que deseas eliminar &ldquo;{clientToDelete?.name}&rdquo;? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => clientToDelete && handleDeleteClient(clientToDelete)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
