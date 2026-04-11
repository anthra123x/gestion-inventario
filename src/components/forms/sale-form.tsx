'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreateSaleSchema } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Trash2, Search } from 'lucide-react'
import { getProducts } from '@/modules/inventory/inventory.actions'
import { getClients } from '@/modules/clients/clients.actions'
import { Product, Client, PaymentMethod } from '@prisma/client'

interface SaleItem {
  productId: string
  quantity: number
  unitPrice: number
  total: number
  product?: Product
}

interface SaleFormProps {
  onSubmit: (data: FormData) => Promise<{ error?: string; success?: string }>
  isLoading?: boolean
}

export function SaleForm({ onSubmit, isLoading = false }: SaleFormProps) {
  const [items, setItems] = useState<SaleItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateSaleSchema),
    defaultValues: {
      clientId: '',
      paymentMethod: 'CASH' as PaymentMethod,
      notes: '',
    }
  })

  const selectedClientId = watch('clientId')
  const paymentMethod = watch('paymentMethod')
  const notes = watch('notes')

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    try {
      const [productsData, clientsData] = await Promise.all([
        getProducts(),
        getClients(),
      ])
      setProducts(productsData)
      setClients(clientsData)
    } catch (error) {
      console.error('Error loading initial data:', error)
    }
  }

  useEffect(() => {
    if (items.length > 0) {
      setValue('items', items)
    }
  }, [items, setValue])

  function addToCart() {
    if (!selectedProduct) return

    const existingItemIndex = items.findIndex(item => item.productId === selectedProduct.id)
    
    if (existingItemIndex >= 0) {
      const updatedItems = [...items]
      updatedItems[existingItemIndex].quantity += quantity
      updatedItems[existingItemIndex].total = updatedItems[existingItemIndex].quantity * selectedProduct.salePrice
      setItems(updatedItems)
    } else {
      setItems([...items, {
        productId: selectedProduct.id,
        quantity,
        unitPrice: selectedProduct.salePrice,
        total: quantity * selectedProduct.salePrice,
        product: selectedProduct,
      }])
    }

    setSelectedProduct(null)
    setQuantity(1)
    setProductSearch('')
    setIsProductDialogOpen(false)
  }

  function removeFromCart(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateQuantity(index: number, newQuantity: number) {
    if (newQuantity < 1) return
    
    const updatedItems = [...items]
    updatedItems[index].quantity = newQuantity
    updatedItems[index].total = newQuantity * updatedItems[index].unitPrice
    setItems(updatedItems)
  }

  const total = items.reduce((sum, item) => sum + item.total, 0)

  async function handleFormSubmit() {
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('clientId', selectedClientId || '')
    formData.append('paymentMethod', paymentMethod || 'CASH')
    formData.append('notes', notes || '')
    formData.append('items', JSON.stringify(items))

    const result = await onSubmit(formData)

    if (result?.error) {
      console.error(result.error)
    } else {
      // Reset form on success
      setItems([])
      setSelectedProduct(null)
      setQuantity(1)
      setProductSearch('')
    }

    setIsSubmitting(false)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nueva Venta</CardTitle>
          <CardDescription>Registra una nueva venta en el sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clientId">Cliente</Label>
              <Select value={selectedClientId} onValueChange={(value: string | null) => value && setValue('clientId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un cliente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Cliente ocasional</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} - {client.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Método de Pago</Label>
              <Select value={paymentMethod} onValueChange={(value) => setValue('paymentMethod', value as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona método de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                  <SelectItem value="MERCADO_PAGO">Mercado Pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Productos</Label>
              <button
                type="button"
                onClick={() => setIsProductDialogOpen(true)}
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </button>
              <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Seleccionar Producto</DialogTitle>
                    <DialogDescription>
                      Busca y selecciona el producto que deseas agregar
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        placeholder="Buscar productos..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Producto</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProducts.map((product) => (
                            <TableRow key={product.id}>
                              <TableCell className="max-w-[200px]">
                                <div className="truncate" title={product.name}>
                                  <div className="font-medium">{product.name}</div>
                                  {product.barcode && (
                                    <div className="text-sm text-gray-500 truncate">SKU: {product.barcode}</div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>${product.salePrice.toLocaleString('es-CO')} COP</TableCell>
                              <TableCell>
                                <Badge variant={product.stock > product.minStock ? 'default' : 'destructive'}>
                                  {product.stock}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => setSelectedProduct(product)}
                                  disabled={product.stock === 0}
                                >
                                  {product.stock === 0 ? 'Agotado' : 'Seleccionar'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {selectedProduct && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{selectedProduct.name}</p>
                            <p className="text-sm text-gray-500">
                              Precio: ${selectedProduct.salePrice.toLocaleString('es-CO')} COP |
                              Stock: {selectedProduct.stock}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label htmlFor="quantity">Cantidad:</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min={1}
                              max={selectedProduct.stock}
                              value={quantity}
                              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                            <Button type="button" onClick={addToCart}>
                              Agregar
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Cart Items */}
            {items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Venta</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product?.name}</div>
                              {item.product?.barcode && (
                                <div className="text-sm text-gray-500">SKU: {item.product.barcode}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>${item.unitPrice.toLocaleString('es-CO')} COP</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={item.product?.stock || 0}
                              value={item.quantity}
                              onChange={(e) => updateQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>${item.total.toLocaleString('es-CO')} COP</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="mt-4 text-right">
                    <div className="text-2xl font-bold">
                      Total: ${total.toLocaleString('es-CO')} COP
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Notas adicionales sobre la venta..."
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isSubmitting || isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleFormSubmit}
              disabled={items.length === 0 || isSubmitting || isLoading}
            >
              {isSubmitting ? 'Procesando...' : 'Registrar Venta'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
