/** Limpieza de datos de prueba filtrados (verify-finance) */
import { prisma } from '@/lib/prisma'

async function main() {
  const deletedExpenses = await prisma.expense.deleteMany({
    where: { description: { in: ['Test gasto 1', 'Test gasto 2'] } },
  })
  console.log('expenses eliminados:', deletedExpenses.count)

  const testSales = await prisma.sale.findMany({
    where: { invoiceNumber: { in: ['TEST-FACT-1', 'TEST-FACT-2'] } },
    select: { id: true, invoiceNumber: true },
  })
  for (const s of testSales) {
    await prisma.sale.delete({ where: { id: s.id } })
  }
  console.log('sales eliminadas:', testSales.length)

  const deletedProducts = await prisma.product.deleteMany({
    where: { name: { in: ['PROD-TEST-A', 'PROD-TEST-B'] } },
  })
  console.log('productos eliminados:', deletedProducts.count)

  const deletedCategory = await prisma.category.deleteMany({
    where: { name: 'Gastos Varios (test)' },
  })
  console.log('categorías eliminadas:', deletedCategory.count)

  const remaining = await prisma.sale.count({ where: { invoiceNumber: { startsWith: 'TEST-' } } })
  console.log('sales TEST restantes:', remaining)
}

main().finally(() => prisma.$disconnect())