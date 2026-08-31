'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, Search, CreditCard, Banknote, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { formatCurrency } from '@/lib/format'
import { toast } from 'sonner'
import { getProducts } from '@/modules/inventory/inventory.actions'
import { createSale } from '@/modules/sales/sales.actions'
import { searchClients } from '@/modules/clients/clients.actions'

interface CartItem {
  productId: string
  name: string
  salePrice: number
  stock: number
  quantity: number
}

export default function SalesPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<
    Array<{
      id: string
      name: string
      salePrice: number
      stock: number
      category: { name: string } | null
    }>
  >([])
  const [loading, setLoading] = useState(false)
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH')
  const [clientId, setClientId] = useState<string | null>(null)
  const [clientSearch, setClientSearch] = useState('')
  const [clients, setClients] = useState<Array<{ id: string; name: string; phone: string | null }>>([])
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    if (clientSearch.length >= 2) {
      searchClients(clientSearch).then(setClients)
    } else {
      setClients([])
    }
  }, [clientSearch])

  async function loadProducts() {
    try {
      const result = await getProducts(undefined, 1, 100)
      setProducts(result.products)
    } catch {
      toast.error('Error al cargar productos')
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(search.toLowerCase()),
  )

  function addToCart(product: (typeof products)[0]) {
    if (product.stock <= 0) {
      toast.error('Sin stock', { description: `${product.name} no tiene stock disponible` })
      return
    }

    const existing = cart.find((item) => item.productId === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Stock insuficiente', { description: `Solo hay ${product.stock} unidades disponibles` })
        return
      }
      setCart(cart.map((item) => (item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          name: product.name,
          salePrice: product.salePrice,
          stock: product.stock,
          quantity: 1,
        },
      ])
    }
  }

  function updateQuantity(productId: string, delta: number) {
    setCart(
      cart.map((item) => {
        if (item.productId !== productId) return item
        const newQty = item.quantity + delta
        if (newQty <= 0) return item
        if (newQty > item.stock) {
          toast.error('Stock insuficiente')
          return item
        }
        return { ...item, quantity: newQty }
      }),
    )
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.salePrice * item.quantity, 0)
  const total = subtotal - discount

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    setLoading(true)
    try {
      const result = await createSale({
        clientId,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        discount,
        paymentMethod,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Venta registrada exitosamente')
      setCart([])
      setDiscount(0)
      setClientId(null)
      setSelectedClient(null)
      setClientSearch('')
      loadProducts()
    } catch {
      toast.error('Error al procesar la venta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container py-6 space-y-6">
      <PageHeader title="Punto de Venta" description="Registrar venta" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar producto..."
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className="p-3 border rounded-lg text-left hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-medium text-sm truncate">{product.name}</div>
                {product.category && <div className="text-xs text-muted-foreground mt-1">{product.category.name}</div>}
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm">{formatCurrency(product.salePrice)}</span>
                  <Badge variant={product.stock <= 5 ? 'destructive' : 'secondary'} className="text-xs">
                    {product.stock}
                  </Badge>
                </div>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <EmptyState
              icon={ShoppingCart}
              title="Sin productos"
              description={search ? 'No hay productos que coincidan' : 'No hay productos disponibles'}
            />
          )}
        </div>

        {/* Carrito */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" />
                Carrito
                {cart.length > 0 && <Badge variant="secondary">{cart.length}</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Agrega productos desde la lista</p>
              ) : (
                <>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {cart.map((item) => (
                      <div key={item.productId} className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{formatCurrency(item.salePrice)} c/u</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => updateQuantity(item.productId, -1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon-sm" onClick={() => updateQuantity(item.productId, 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cliente */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Cliente (opcional)</label>
                    {selectedClient ? (
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">{selectedClient.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setClientId(null)
                            setSelectedClient(null)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Input
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          placeholder="Buscar cliente..."
                          className="text-sm"
                        />
                        {clients.length > 0 && (
                          <div className="absolute z-10 w-full bg-background border rounded-md mt-1 max-h-40 overflow-y-auto">
                            {clients.map((client) => (
                              <button
                                key={client.id}
                                onClick={() => {
                                  setClientId(client.id)
                                  setSelectedClient({ id: client.id, name: client.name })
                                  setClientSearch('')
                                  setClients([])
                                }}
                                className="w-full p-2 text-left text-sm hover:bg-accent"
                              >
                                {client.name} {client.phone && `(${client.phone})`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Descuento */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Descuento</label>
                    <Input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>

                  {/* Método de pago */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium">Método de pago</label>
                    <Select
                      value={paymentMethod}
                      onValueChange={(v) => setPaymentMethod(v as 'CASH' | 'CARD' | 'TRANSFER')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">
                          <span className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Efectivo
                          </span>
                        </SelectItem>
                        <SelectItem value="CARD">
                          <span className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Tarjeta
                          </span>
                        </SelectItem>
                        <SelectItem value="TRANSFER">
                          <span className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            Transferencia
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Totales */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Descuento</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <Button className="w-full" size="lg" onClick={handleCheckout} disabled={loading || cart.length === 0}>
                    {loading ? 'Procesando...' : 'Cobrar'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
