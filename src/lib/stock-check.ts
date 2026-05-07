import { PrismaClient } from '@prisma/client'

type Tx = PrismaClient['$extends'] extends never
  ? ReturnType<Parameters<PrismaClient['$transaction']>[0] extends (tx: infer T) => unknown ? () => T : never>
  : never

interface StockItem {
  productId: string
  quantity: number
  productName?: string
}

export async function checkStockAvailability(
  tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  items: StockItem[]
): Promise<void> {
  for (const item of items) {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
      select: { name: true, stock: true },
    })

    if (!product) {
      throw new Error(`Producto con ID ${item.productId} no encontrado`)
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
      )
    }
  }
}
