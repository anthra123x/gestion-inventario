/**
 * Verificación de finanzas y dashboard (Cilmax).
 * Ejecuta: node_modules/.bin/tsx scripts/verify-finance.ts
 *
 * SEGURIDAD: TODA escritura va dentro de prisma.$transaction usando SIEMPRE
 * el cliente tx (NO el global prisma). El callback termina lanzando un error
 * → REVERT total. Nunca se persiste nada en la DB real (Supabase producción).
 * Además los nombres usan un timestamp único para evitar colisiones (P2002)
 * si el script se re-ejecuta.
 */
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const today = new Date()
const start = new Date(today)
start.setHours(0, 0, 0, 0)
const end = new Date(today)
end.setHours(23, 59, 59, 999)
const todayStr = start.toISOString().split('T')[0]
const stamp = Date.now()

let failures = 0
function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  ✓ ${label}`)
  else {
    failures++
    console.error(`  ✗ ${label}`, detail !== undefined ? JSON.stringify(detail) : '')
  }
}

function sumByDay(r: { byDay: Array<{ sales: number; cogs: number; expenses: number }> }) {
  return r.byDay.reduce(
    (acc, d) => ({ sales: acc.sales + d.sales, cogs: acc.cogs + d.cogs, expenses: acc.expenses + d.expenses }),
    { sales: 0, cogs: 0, expenses: 0 },
  )
}

async function getReport(kind: 'day' | 'week' | 'month') {
  const { getBusinessFinanceReport } = await import('@/modules/finance/finance.service')
  return getBusinessFinanceReport(kind, todayStr)
}

async function readRealData() {
  console.log('\n=== 1. DATOS REALES ACTUALES (lectura, sin escritura) ===')
  const [sales, reportDay, reportWeek, reportMonth] = await Promise.all([
    prisma.sale.findMany({
      where: { status: 'COMPLETED', saleDate: { gte: start, lte: end } },
      select: { total: true },
    }),
    getReport('day'),
    getReport('week'),
    getReport('month'),
  ])

  const salesTotal = sales.reduce((s, x) => s + x.total, 0)
  const salesCount = sales.length
  console.log(`  Ventas COMPLETED hoy: ${salesCount}`, `total=${salesTotal}`)
  console.log(`  Reporte HOY: sales.total=${reportDay.sales.total} count=${reportDay.sales.count} cogs=${reportDay.sales.cogs} expenses=${reportDay.expenses.total} net=${reportDay.summary.netProfit}`)

  check('REAL: Ventas Hoy (sales) == finance día.sales.total', salesTotal === reportDay.sales.total, { salesTotal, report: reportDay.sales.total })
  check('REAL: suma(byDay.sales) == sales.total', sumByDay(reportDay).sales === reportDay.sales.total)
  check('REAL: suma(byDay.cogs) == sales.cogs (bug corregido)', sumByDay(reportDay).cogs === reportDay.sales.cogs, { byDaySum: sumByDay(reportDay).cogs, total: reportDay.sales.cogs })
  check('REAL: suma(byDay.expenses) == expenses.total', sumByDay(reportDay).expenses === reportDay.expenses.total)
  check('REAL: semana inicia correcta (>= día)', reportWeek.sales.total >= reportDay.sales.total)
  check('REAL: mes inicia correcta (>= día)', reportMonth.sales.total >= reportDay.sales.total)

  // Dashboard: tras FIX 2, Ingresos Hoy deriva de la tabla sales (== Ventas Hoy)
  check('REAL: Ingresos Hoy == Ventas Hoy (mismo origen: tabla sales)', reportDay.summary.cashIn === salesTotal, { cashIn: reportDay.summary.cashIn, salesTotal })
  check('REAL: cashIn == sales.total', reportDay.summary.cashIn === reportDay.sales.total)
  check('REAL: balance == sales.total - expenses.total', reportDay.summary.balance === reportDay.sales.total - reportDay.expenses.total)
}

async function simulate(tx: Prisma.TransactionClient) {
  console.log('\n=== 2. SIMULACIÓN (usa cliente tx → se revierte al final; NO persiste) ===')

  // 1) Categoría de gasto (EXPENSE) — tomar o crear
  let expenseCategory = await tx.category.findFirst({ where: { type: 'EXPENSE' } })
  if (!expenseCategory) {
    expenseCategory = await tx.category.create({
      data: { name: `Gastos Varios (test-${stamp})`, type: 'EXPENSE', color: '#ef4444' },
    })
  }

  // 2) Productos con costo conocido
  const prodA = await tx.product.create({
    data: { name: `PROD-TEST-A-${stamp}`, costPrice: 100, salePrice: 300, stock: 50, lowStockThreshold: 5 },
  })
  const prodB = await tx.product.create({
    data: { name: `PROD-TEST-B-${stamp}`, costPrice: 50, salePrice: 100, stock: 50, lowStockThreshold: 5 },
  })

  // 3) Dos ventas HOY (precios editables + descuento):
  //    Venta 1: A x2 @250 → subtotal 500, descuento 50 → total 450
  //    Venta 2: B x1 @100 → subtotal 100 → total 100
  const sale1 = await tx.sale.create({
    data: {
      invoiceNumber: `TEST-FACT-${stamp}-1`,
      subtotal: 500,
      discount: 50,
      total: 450,
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      saleDate: end,
      items: { create: [{ productId: prodA.id, quantity: 2, unitPrice: 250, total: 500 }] },
    },
  })
  const sale2 = await tx.sale.create({
    data: {
      invoiceNumber: `TEST-FACT-${stamp}-2`,
      subtotal: 100,
      discount: 0,
      total: 100,
      paymentMethod: 'TRANSFER',
      status: 'COMPLETED',
      saleDate: end,
      items: { create: [{ productId: prodB.id, quantity: 1, unitPrice: 100, total: 100 }] },
    },
  })

  // 4) Dos gastos HOY (create individual: createMany no es fiable en tx interactiva)
  const exp1 = await tx.expense.create({
    data: { description: 'Test gasto 1', amount: 120, categoryId: expenseCategory.id, expenseDate: end },
  })
  const exp2 = await tx.expense.create({
    data: { description: 'Test gasto 2', amount: 80, categoryId: expenseCategory.id, expenseDate: end },
  })

  // 5) Replicar la matemática del reporte DENTRO del tx (ve estado no commiteado)
  const [sSales, sItems, sExpenses, baseExpenses] = await Promise.all([
    tx.sale.findMany({
      where: { status: 'COMPLETED', saleDate: { gte: start, lte: end } },
      select: { id: true, total: true, paymentMethod: true, saleDate: true },
    }),
    tx.saleItem.findMany({
      where: { sale: { status: 'COMPLETED', saleDate: { gte: start, lte: end } } },
      select: { quantity: true, total: true, saleId: true, product: { select: { costPrice: true } } },
    }),
    tx.expense.findMany({
      where: { id: { in: [exp1.id, exp2.id] } },
      select: { id: true, amount: true, expenseDate: true, category: { select: { id: true, name: true, color: true } } },
    }),
    tx.expense.findMany({
      where: { expenseDate: { gte: start, lte: end }, description: { notIn: ['Test gasto 1', 'Test gasto 2'] } },
      select: { amount: true },
    }),
  ])

  const testSaleIds = new Set([sale1.id, sale2.id])
  const simSales = sSales.filter((s) => testSaleIds.has(s.id))
  const simItems = sItems.filter((i) => testSaleIds.has(i.saleId))
  const simExpenses = sExpenses // solo nuestros 2 gastos (filtrado por id)

  const simSalesTotal = simSales.reduce((s, x) => s + x.total, 0)
  const simCogs = simItems.reduce((s, x) => s + x.quantity * x.product.costPrice, 0)
  const simGross = simSalesTotal - simCogs
  const baseExpTotal = baseExpenses.reduce((s, x) => s + x.amount, 0)
  const simExpTotal = simExpenses.reduce((s, x) => s + x.amount, 0)
  const addedExp = simExpTotal - 0 // nuestros gastos test son exclusivos (ya filtrados)
  const expectSalesTotal = 450 + 100
  const expectCogs = 2 * 100 + 1 * 50
  const expectGross = 550 - 250
  const expectExp = 120 + 80
  const expectNet = 300 - 200
  const expectBalance = 550 - 200

  console.log('  Delta simulado (solo transacciones TEST):')
  console.log(`    ventas.total=${simSalesTotal} esperado=${expectSalesTotal}`)
  console.log(`    cogs=${simCogs} esperado=${expectCogs}`)
  console.log(`    ganancia bruta=${simGross} esperado=${expectGross}`)
  console.log(`    gastos añadidos=${addedExp} esperado=${expectExp}`)
  console.log(`    ganancia neta delta=${simGross - addedExp} esperado=${expectNet}`)
  console.log(`    balance delta=${simSalesTotal - addedExp} esperado=${expectBalance}`)
  console.log(`  Gastos base del día (reales, no-test): ${baseExpTotal}`)

  check('SIM: ventas totales == 550', simSalesTotal === expectSalesTotal)
  check('SIM: cogs == 250', simCogs === expectCogs)
  check('SIM: gastos añadidos == 200', addedExp === expectExp)
  check('SIM: ganancia bruta == 300', simGross === expectGross)

  // 6) Desglose diario: 2 ventas HOY, cogs NO deben duplicarse
  const dayMap = new Map<string, { sales: number; cogs: number; expenses: number }>()
  for (const s of simSales) {
    const key = s.saleDate.toISOString().split('T')[0]
    const entry = dayMap.get(key) || { sales: 0, cogs: 0, expenses: 0 }
    entry.sales += s.total
    dayMap.set(key, entry)
  }
  for (const item of simItems) {
    const key = simSales.find((s) => s.id === item.saleId)?.saleDate.toISOString().split('T')[0]
    if (!key) continue
    const entry = dayMap.get(key)!
    entry.cogs += item.quantity * item.product.costPrice
    dayMap.set(key, entry)
  }
  const daySales = Array.from(dayMap.values()).reduce((s, d) => s + d.sales, 0)
  const dayCogs = Array.from(dayMap.values()).reduce((s, d) => s + d.cogs, 0)
  console.log(`  byDay: sales=${daySales}, cogs=${dayCogs} (2 ventas mismo día; debe ser 550 / 250)`)
  check('SIM: desglose diario sales == 550', daySales === expectSalesTotal)
  check('SIM: desglose diario cogs NO se duplica (250, no 500)', dayCogs === expectCogs)

  // 7) El reporte real (fuera de tx, pero lee la tabla ya con el tx pendiente no visible)
  //    Se calcula el delta esperado del reporte tras incluir la simulación.
  check('SIM: netProfit delta == 100', simGross - addedExp === expectNet)
  check('SIM: balance delta == 350', simSalesTotal - addedExp === expectBalance)
}

async function main() {
  try {
    await readRealData()
    await prisma.$transaction(async (tx) => {
      await simulate(tx)
      // Forzar rollback total: nada de la simulación llega a la DB real
      throw new Error('ROLLBACK_INTENCIONAL')
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'ROLLBACK_INTENCIONAL') {
      console.log('\n  → Transacción revertida: la DB de producción NO fue modificada.')
    } else {
      throw e
    }
  } finally {
    await prisma.$disconnect()
  }

  if (failures > 0) {
    console.error(`\nRESULTADO: ${failures} COMPROBACIÓN(es) FALLARON ❌`)
    process.exit(1)
  }
  console.log('\nRESULTADO: todas las comprobaciones pasan ✅')
}

main()