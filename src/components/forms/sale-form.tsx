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
import { toast } from 'sonner'
import { Plus, Trash2, Search, Loader2, User, Phone, Mail, MapPin } from 'lucide-react'
import { getProducts } from '@/modules/inventory/inventory.actions'
import { Product, PaymentMethod } from '@prisma/client'

function formatCOP(value: number): string {
  return value.toLocaleString('es-CO')
}

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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(CreateSaleSchema),
    defaultValues: {
      paymentMethod: 'CASH' as PaymentMethod,
      notes: '',
      clientName: '',
      clientPhone: '',
      clientEmail: '',
      clientAddress: '',
    }
  })

  const paymentMethod = watch('paymentMethod')
  const notes = watch('notes')
  const clientName = watch('clientName')
  const clientPhone = watch('clientPhone')
  const clientEmail = watch('clientEmail')
  const clientAddress = watch('clientAddress')

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setIsLoadingData(true)
    try {
      const productsData = await getProducts()
      setProducts(productsData)
    } catch (error) {
      toast.error('Error al cargar datos', {
        description: 'No se pudieron cargar los productos. Por favor intenta nuevamente.',
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (items.length > 0) {
      setValue('items', items)
    }
  }, [items, setValue])

  function addToCart() {
    if (!selectedProduct) return

    // Validar stock
    if (quantity > selectedProduct.stock) {
      toast.error('Stock insuficiente', {
        description: `Solo hay ${selectedProduct.stock} unidades disponibles.`,
      })
      return
    }

    const existingItemIndex = items.findIndex(item => item.productId === selectedProduct.id)

    if (existingItemIndex >= 0) {
      const newQuantity = items[existingItemIndex].quantity + quantity
      if (newQuantity > selectedProduct.stock) {
        toast.error('Stock insuficiente', {
          description: `El total (${newQuantity}) excede el stock disponible (${selectedProduct.stock}).`,
        })
        return
      }
      const updatedItems = [...items]
      updatedItems[existingItemIndex].quantity = newQuantity
      updatedItems[existingItemIndex].total = newQuantity * selectedProduct.salePrice
      setItems(updatedItems)
      toast.success('Cantidad actualizada', {
        description: `${selectedProduct.name} actualizado a ${newQuantity} unidades.`,
      })
    } else {
      setItems([...items, {
        productId: selectedProduct.id,
        quantity,
        unitPrice: selectedProduct.salePrice,
        total: quantity * selectedProduct.salePrice,
        product: selectedProduct,
      }])
      toast.success('Producto agregado', {
        description: `${selectedProduct.name} agregado al carrito.`,
      })
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

    const item = items[index]
    const maxStock = item.product?.stock || 0

    if (newQuantity > maxStock) {
      toast.error('Stock insuficiente', {
        description: `Solo hay ${maxStock} unidades disponibles.`,
      })
      return
    }

    const updatedItems = [...items]
    updatedItems[index].quantity = newQuantity
    updatedItems[index].total = newQuantity * updatedItems[index].unitPrice
    setItems(updatedItems)
  }

  const total = items.reduce((sum, item) => sum + item.total, 0)

  async function handleFormSubmit() {
    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('clientId', '')
    formData.append('clientName', clientName || '')
    formData.append('clientPhone', clientPhone || '')
    formData.append('clientEmail', clientEmail || '')
    formData.append('clientAddress', clientAddress || '')
    formData.append('paymentMethod', paymentMethod || 'CASH')
    formData.append('notes', notes || '')
    formData.append('items', JSON.stringify(items))

    const result = await onSubmit(formData)

    if (result?.error) {
      toast.error('Error al registrar venta', {
        description: result.error,
      })
    } else {
      toast.success('Factura generada exitosamente', {
        description: 'La venta ha sido guardada en el sistema.',
      })
      // Reset form on success
      setItems([])
      setSelectedProduct(null)
      setQuantity(1)
      setProductSearch('')
      setValue('paymentMethod', 'CASH')
      setValue('notes', '')
      setValue('clientName', '')
      setValue('clientPhone', '')
      setValue('clientEmail', '')
      setValue('clientAddress', '')
    }

    setIsSubmitting(false)
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generar Factura</CardTitle>
          <CardDescription>Registra una nueva venta en el sistema</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Data */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-5 w-5" />
              <h3 className="font-semibold">Datos del Cliente</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nombre *</Label>
                <Input
                  id="clientName"
                  {...register('clientName')}
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="clientPhone"
                    {...register('clientPhone')}
                    placeholder="Teléfono (opcional)"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="clientEmail"
                    {...register('clientEmail')}
                    placeholder="Email (opcional)"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientAddress">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="clientAddress"
                    {...register('clientAddress')}
                    placeholder="Dirección (opcional)"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Método de Pago</Label>
            <Select value={paymentMethod} onValueChange={(value) => setValue('paymentMethod', value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona método de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Efectivo</SelectItem>
                <SelectItem value="TRANSFER">Transferencia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Product Selection */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Productos</Label>
              <Button
                type="button"
                onClick={() => setIsProductDialogOpen(true)}
                disabled={isLoadingData}
              >
                {isLoadingData ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Agregar Producto
              </Button>
            </div>

            <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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

                  <div className="max-h-[400px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Producto</TableHead>
                          <TableHead className="w-[20%]">Precio</TableHead>
                          <TableHead className="w-[15%]">Stock</TableHead>
                          <TableHead className="w-[25%]">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                              No se encontraron productos
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredProducts.map((product) => (
                            <TableRow key={product.id} className="hover:bg-muted/50">
                              <TableCell className="max-w-[300px]">
                                <div className="truncate" title={product.name}>
                                  <div className="font-medium">{product.name}</div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${formatCOP(product.salePrice)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={product.stock > product.minStock ? 'default' : 'destructive'}
                                  className="w-fit"
                                >
                                  {product.stock}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => setSelectedProduct(product)}
                                  disabled={product.stock === 0}
                                  className="w-full"
                                >
                                  {product.stock === 0 ? 'Agotado' : 'Seleccionar'}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {selectedProduct && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-lg">{selectedProduct.name}</p>
                          <div className="text-sm text-gray-500 space-y-1">
                            <p>Precio: ${formatCOP(selectedProduct.salePrice)} COP</p>
                            <p>Stock disponible: {selectedProduct.stock} unidades</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="quantity">Cantidad:</Label>
                            <Input
                              id="quantity"
                              type="number"
                              min={1}
                              max={selectedProduct.stock}
                              value={quantity}
                              onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, selectedProduct.stock))}
                              className="w-24"
                            />
                          </div>
                          <Button type="button" onClick={addToCart} size="lg">
                            Agregar al Carrito
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
                      <TableHead className="w-[40%]">Producto</TableHead>
                      <TableHead className="w-[15%]">Precio Unit.</TableHead>
                      <TableHead className="w-[15%]">Cantidad</TableHead>
                      <TableHead className="w-[20%]">Total</TableHead>
                      <TableHead className="w-[10%]">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="max-w-[300px]">
                          <div className="truncate" title={item.product?.name}>
                            <div className="font-medium">{item.product?.name}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${formatCOP(item.unitPrice)}
                        </TableCell>
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
                        <TableCell className="text-right font-medium">
                          ${formatCOP(item.total)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFromCart(index)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex justify-end">
                  <div className="text-2xl font-bold">
                    Total: ${formatCOP(total)} COP
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
              {isSubmitting ? 'Procesando...' : 'Generar Factura'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
