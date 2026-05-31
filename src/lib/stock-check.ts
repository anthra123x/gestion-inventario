interface StockItem {
  productId: string
  quantity: number
}

type TransactionClient = {
  product: {
    findMany: (args: {
      where: { id: { in: string[] } }
      select: { id: true; name: true; stock: true }
    }) => Promise<Array<{ id: string; name: string; stock: number }>>
  }
}

export async function checkStockAvailability(
  tx: TransactionClient,
  items: StockItem[],
): Promise<void> {
  const productIds = items.map((i) => i.productId)

  const products = await tx.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, stock: true },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const item of items) {
    const product = productMap.get(item.productId)

    if (!product) {
      throw new Error(`Producto con ID ${item.productId} no encontrado`)
    }

    if (product.stock < item.quantity) {
      throw new Error(
        `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`,
      )
    }
  }
}
