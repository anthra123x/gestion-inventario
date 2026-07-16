import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export function getWeekPeriod(dateStr?: string) {
  const date = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const day = date.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(sunday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { startDate: monday, endDate: sunday }
}

export async function getOrCreateActivePeriod(dateStr?: string) {
  const { startDate, endDate } = getWeekPeriod(dateStr)

  const activePeriod = await prisma.budgetPeriod.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, startDate: true },
  })

  if (activePeriod) {
    const activeStart = activePeriod.startDate.toISOString().split('T')[0]
    const expectedStart = startDate.toISOString().split('T')[0]
    if (activeStart === expectedStart) {
      const existing = await prisma.budgetPeriod.findUnique({
        where: { id: activePeriod.id },
        include: { transactions: { include: { category: true }, orderBy: { date: 'desc' } } },
      })
      if (existing) return existing
    }
  }

  await prisma.budgetPeriod.updateMany({
    where: { status: 'ACTIVE' },
    data: { status: 'CLOSED' },
  })

  return await prisma.budgetPeriod.create({
    data: { startDate, endDate },
    include: { transactions: { include: { category: true }, orderBy: { date: 'desc' } } },
  })
}

export async function getPeriodById(periodId: string) {
  return await prisma.budgetPeriod.findUnique({
    where: { id: periodId },
    include: { transactions: { include: { category: true }, orderBy: { date: 'desc' } } },
  })
}

export async function getClosedPeriods(limit = 10) {
  return await prisma.budgetPeriod.findMany({
    where: { status: 'CLOSED' },
    orderBy: { endDate: 'desc' },
    take: limit,
    include: { transactions: { take: 3, include: { category: true }, orderBy: { date: 'desc' } } },
  })
}

export type DailySummary = {
  date: string
  totalIncome: number
  totalExpenses: number
  balance: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  transactions: any[]
  expenseByCategory: { category: string; amount: number; color: string | null }[]
}

export async function getDailySummary(dateStr?: string): Promise<DailySummary> {
  const date = dateStr ? new Date(dateStr) : new Date()
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)

  const [transactions, finishedRepairs] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: start, lte: end } },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.repair.findMany({
      where: {
        status: 'DELIVERED',
        dateDelivered: { gte: start, lte: end },
      },
      select: { laborCost: true, id: true, device: true },
    }),
  ])

  const repairIncome = finishedRepairs.reduce((s, r) => s + r.laborCost, 0)
  const txIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalIncome = txIncome + repairIncome
  const totalExpenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)
  const expenseByCategory = aggregateByCategory(transactions.filter((t) => t.type === 'EXPENSE'))

  return {
    date: date.toISOString().split('T')[0],
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    transactions: transactions as unknown as DailySummary['transactions'],
    expenseByCategory,
  }
}

function aggregateByCategory(
  transactions: Array<{ amount: number; category: { name: string; color: string | null } }>,
): { category: string; amount: number; color: string | null }[] {
  const map = new Map<string, { amount: number; color: string | null }>()
  for (const tx of transactions) {
    const name = tx.category?.name || 'Sin categoría'
    const existing = map.get(name)
    if (existing) existing.amount += tx.amount
    else map.set(name, { amount: tx.amount, color: tx.category?.color || null })
  }
  return Array.from(map.entries()).map(([category, data]) => ({ category, ...data })).sort((a, b) => b.amount - a.amount)
}

export type PeriodSummary = {
  period: NonNullable<Awaited<ReturnType<typeof getOrCreateActivePeriod>>>
  totalIncome: number
  totalExpenses: number
  balance: number
  netAfterSavings: number
  dailyBreakdown: { date: string; income: number; expenses: number; balance: number }[]
  expenseByCategory: { category: string; amount: number; color: string | null }[]
  incomeByCategory: { category: string; amount: number; color: string | null }[]
}

export async function getPeriodSummary(dateStr?: string, periodId?: string): Promise<PeriodSummary> {
  const period = periodId ? await getActivePeriodById(periodId) : (await getOrCreateActivePeriod(dateStr))!
  const transactions = period.transactions

  const txIncome = transactions.filter((t) => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = transactions.filter((t) => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0)

  const finishedRepairs = await prisma.repair.findMany({
    where: {
      status: 'DELIVERED',
      dateDelivered: { gte: period.startDate, lte: period.endDate },
    },
    select: { laborCost: true, dateDelivered: true },
  })
  const repairIncome = finishedRepairs.reduce((s, r) => s + r.laborCost, 0)
  const totalIncome = txIncome + repairIncome
  const balance = totalIncome - totalExpenses

  const dailyMap = new Map<string, { income: number; expenses: number }>()
  for (let d = new Date(period.startDate); d <= period.endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0]
    dailyMap.set(key, { income: 0, expenses: 0 })
  }
  for (const tx of transactions) {
    const key = tx.date.toISOString().split('T')[0]
    const entry = dailyMap.get(key)
    if (entry) {
      if (tx.type === 'INCOME') entry.income += tx.amount
      else entry.expenses += tx.amount
    }
  }
  for (const r of finishedRepairs) {
    if (!r.dateDelivered) continue
    const key = r.dateDelivered.toISOString().split('T')[0]
    const entry = dailyMap.get(key)
    if (entry) entry.income += r.laborCost
  }
  const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    ...data,
    balance: data.income - data.expenses,
  }))

  const allIncome = [...transactions.filter((t) => t.type === 'INCOME'), ...finishedRepairs.map((r) => ({
    amount: r.laborCost,
    category: { name: 'Trabajo Técnico', color: '#22c55e' },
  }))]

  return {
    period,
    totalIncome,
    totalExpenses,
    balance,
    netAfterSavings: balance - period.savingsAllocated,
    dailyBreakdown,
    expenseByCategory: aggregateByCategory(transactions.filter((t) => t.type === 'EXPENSE')),
    incomeByCategory: aggregateByCategory(allIncome),
  }
}

export async function closeCurrentPeriod(savingsTarget?: number) {
  const period = await getOrCreateActivePeriod()
  const { totalIncome, totalExpenses } = await getPeriodTotals(period.id)
  const balance = totalIncome - totalExpenses

  const savingsAmount = savingsTarget !== undefined ? Math.min(savingsTarget, Math.max(balance, 0)) : (balance > 0 ? balance : 0)

  let goalReached = false
  let goalName = ''
  let activeGoalId: string | undefined

  if (savingsAmount > 0) {
    const savingCategory = await prisma.category.findFirst({
      where: { name: 'Ahorro', type: 'SAVING_GOAL', deletedAt: null },
    })
    if (savingCategory) {
      await prisma.transaction.create({
        data: {
          type: 'INCOME',
          amount: savingsAmount,
          description: `Ahorro semanal - ${period.startDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`,
          date: period.endDate,
          categoryId: savingCategory.id,
          periodId: period.id,
          notes: 'Ahorro generado al cerrar la semana',
        },
      })

      const activeGoal = await prisma.savingGoal.findFirst({ orderBy: { createdAt: 'desc' } })
      if (activeGoal) {
        activeGoalId = activeGoal.id
        const newAmount = activeGoal.currentAmount + savingsAmount
        await prisma.savingGoal.update({
          where: { id: activeGoal.id },
          data: { currentAmount: newAmount },
        })
        if (newAmount >= activeGoal.targetAmount && activeGoal.currentAmount < activeGoal.targetAmount) {
          goalReached = true
          goalName = activeGoal.name
        }
      }
    }
  }

  const nextDay = new Date(period.endDate.getTime() + 86400000)
  const { startDate, endDate } = getWeekPeriod(nextDay.toISOString().split('T')[0])

  await prisma.budgetPeriod.update({
    where: { id: period.id },
    data: {
      status: 'CLOSED',
      savingsAllocated: savingsAmount,
    },
  })

  const newPeriod = await prisma.budgetPeriod.create({
    data: { startDate, endDate },
    include: { transactions: { include: { category: true }, orderBy: { date: 'desc' } } },
  })

  // Create notifications
  const users = await prisma.user.findMany({ select: { id: true } })
  if (users.length > 0) {
    const weekLabel = period.startDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })
    const message = savingsAmount > 0
      ? `Balance: ${formatAmount(balance)} · Ahorrado: ${formatAmount(savingsAmount)}`
      : `Balance: ${formatAmount(balance)} · No se asignó ahorro`

    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: 'WEEK_CLOSED',
        title: `Semana del ${weekLabel} cerrada`,
        message,
        entityType: 'budget_period',
        entityId: period.id,
      })),
    })

    if (goalReached) {
      await prisma.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          type: 'SAVING_GOAL_REACHED',
          title: `Meta de ahorro "${goalName}" cumplida`,
          message: `Has alcanzado tu meta de ahorro. Sigue así.`,
          entityType: 'saving_goal',
          entityId: activeGoalId,
        })),
      })
    }
  }

  return { closedPeriod: period, newPeriod, savingsAmount }
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount)
}

async function getActivePeriodById(periodId: string) {
  return await prisma.budgetPeriod.findUniqueOrThrow({
    where: { id: periodId },
    include: { transactions: { include: { category: true }, orderBy: { date: 'desc' } } },
  })
}

async function getPeriodTotals(periodId: string) {
  const agg = await prisma.transaction.aggregate({
    where: { periodId },
    _sum: { amount: true },
  })
  const incomeAgg = await prisma.transaction.aggregate({
    where: { periodId, type: 'INCOME' },
    _sum: { amount: true },
  })
  const expenseAgg = await prisma.transaction.aggregate({
    where: { periodId, type: 'EXPENSE' },
    _sum: { amount: true },
  })
  return {
    totalIncome: incomeAgg._sum.amount || 0,
    totalExpenses: expenseAgg._sum.amount || 0,
    total: agg._sum.amount || 0,
  }
}

// ─── Existing functions adapted ───

export async function getCategories(type?: string) {
  const where: Prisma.CategoryWhereInput = { deletedAt: null }
  if (type) where.type = type as 'INCOME' | 'EXPENSE' | 'SAVING_GOAL'
  return await prisma.category.findMany({ where, orderBy: { name: 'asc' } })
}

export async function getCategoryById(id: string) {
  return await prisma.category.findUnique({ where: { id } })
}

export async function createCategory(data: {
  name: string
  type: 'INCOME' | 'EXPENSE' | 'SAVING_GOAL'
  color?: string | null
  icon?: string | null
  budget?: number | null
}) {
  return await prisma.category.create({ data })
}

export async function updateCategory(id: string, data: Record<string, unknown>) {
  return await prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  return await prisma.category.update({ where: { id }, data: { deletedAt: new Date() } })
}

export type TransactionFilters = {
  type?: 'INCOME' | 'EXPENSE'
  categoryId?: string
  startDate?: string
  endDate?: string
  isRecurring?: boolean
  periodId?: string
  page?: number
  pageSize?: number
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const where: Prisma.TransactionWhereInput = {}
  if (filters.type) where.type = filters.type
  if (filters.categoryId) where.categoryId = filters.categoryId
  if (filters.periodId) where.periodId = filters.periodId
  if (filters.isRecurring !== undefined) where.isRecurring = filters.isRecurring
  if (filters.startDate || filters.endDate) {
    where.date = {}
    if (filters.startDate) where.date.gte = new Date(filters.startDate)
    if (filters.endDate) where.date.lte = new Date(filters.endDate)
  }

  const page = filters.page || 1
  const pageSize = filters.pageSize || 20
  const skip = (page - 1) * pageSize

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, period: true },
      orderBy: { date: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ])

  return { items, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function getTransactionById(id: string) {
  return await prisma.transaction.findUnique({ where: { id }, include: { category: true, period: true } })
}

export async function createTransaction(data: {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  date?: string | Date
  categoryId: string
  periodId?: string
  isRecurring?: boolean
  recurringDay?: number | null
  notes?: string | null
}) {
  const txDate = data.date ? new Date(data.date) : new Date()
  const dateStr = txDate.toISOString().split('T')[0]
  const periodId = data.periodId || (await getOrCreateActivePeriod(dateStr)).id
  return await prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: txDate,
      categoryId: data.categoryId,
      periodId,
      isRecurring: data.isRecurring ?? false,
      recurringDay: data.recurringDay ?? null,
      notes: data.notes ?? null,
    },
    include: { category: true, period: true },
  })
}

export async function updateTransaction(id: string, data: Record<string, unknown>) {
  return await prisma.transaction.update({
    where: { id },
    data,
    include: { category: true, period: true },
  })
}

export async function deleteTransaction(id: string) {
  return await prisma.transaction.delete({ where: { id } })
}

export type FinanceSummary = {
  totalIncome: number
  totalExpenses: number
  balance: number
  dailySummary: DailySummary | null
  periodSummary: PeriodSummary | null
  incomeByCategory: { category: string; amount: number; color: string | null }[]
  expenseByCategory: { category: string; amount: number; color: string | null }[]
  monthlyData: { month: string; income: number; expenses: number }[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentTransactions: any[]
  savingGoals: Awaited<ReturnType<typeof getSavingGoals>>
}

export async function getFinanceSummary(dateStr?: string): Promise<FinanceSummary> {
  const now = dateStr ? new Date(dateStr + 'T12:00:00') : new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59)

  const [dailySummary, periodSummary, monthlyAgg, recentTransactions, savingGoals, monthlyRepairs] = await Promise.all([
    getDailySummary(dateStr),
    getPeriodSummary(dateStr).catch(() => null),
    prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where: { date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      take: 5,
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    getSavingGoals(),
    prisma.repair.findMany({
      where: {
        status: 'DELIVERED',
        dateDelivered: { gte: startOfMonth, lte: endOfMonth },
      },
      select: { laborCost: true, dateDelivered: true },
    }),
  ])

  const repairIncomeTotal = monthlyRepairs.reduce((s, r) => s + r.laborCost, 0)

  const txIncome = monthlyAgg
    .filter((g) => g.type === 'INCOME')
    .reduce((sum, g) => sum + (g._sum.amount || 0), 0)
  const totalExpenses = monthlyAgg
    .filter((g) => g.type === 'EXPENSE')
    .reduce((sum, g) => sum + (g._sum.amount || 0), 0)
  const totalIncome = txIncome + repairIncomeTotal

  const categoryIds = monthlyAgg.map((g) => g.categoryId)
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    : []
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const incomeByCategory = [
    ...monthlyAgg
      .filter((g) => g.type === 'INCOME')
      .map((g) => ({
        category: categoryMap.get(g.categoryId)?.name || 'Sin categoría',
        amount: g._sum.amount || 0,
        color: categoryMap.get(g.categoryId)?.color || null,
      })),
  ]
  if (repairIncomeTotal > 0) {
    incomeByCategory.push({
      category: 'Trabajo Técnico',
      amount: repairIncomeTotal,
      color: '#22c55e',
    })
  }

  const expenseByCategory = monthlyAgg
    .filter((g) => g.type === 'EXPENSE')
    .map((g) => ({
      category: categoryMap.get(g.categoryId)?.name || 'Sin categoría',
      amount: g._sum.amount || 0,
      color: categoryMap.get(g.categoryId)?.color || null,
    }))

  const [monthlyTransactions, yearlyRepairs] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: startOfYear, lte: endOfYear } },
      select: { type: true, amount: true, date: true },
      orderBy: { date: 'asc' },
    }),
    prisma.repair.findMany({
      where: {
        status: 'DELIVERED',
        dateDelivered: { gte: startOfYear, lte: endOfYear },
      },
      select: { laborCost: true, dateDelivered: true },
    }),
  ])

  const monthlyMap = new Map<string, { income: number; expenses: number }>()
  for (let m = 0; m < 12; m++) {
    const key = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`
    monthlyMap.set(key, { income: 0, expenses: 0 })
  }
  for (const tx of monthlyTransactions) {
    const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`
    const entry = monthlyMap.get(key)
    if (entry) {
      if (tx.type === 'INCOME') entry.income += tx.amount
      else entry.expenses += tx.amount
    }
  }
  for (const r of yearlyRepairs) {
    if (!r.dateDelivered) continue
    const key = `${r.dateDelivered.getFullYear()}-${String(r.dateDelivered.getMonth() + 1).padStart(2, '0')}`
    const entry = monthlyMap.get(key)
    if (entry) entry.income += r.laborCost
  }
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({ month, ...data }))

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    dailySummary,
    periodSummary,
    incomeByCategory,
    expenseByCategory,
    monthlyData,
    recentTransactions,
    savingGoals,
  }
}

export async function getSavingGoals() {
  return await prisma.savingGoal.findMany({
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function createSavingGoal(data: {
  name: string
  targetAmount: number
  currentAmount?: number
  deadline?: string | null
  categoryId?: string | null
}) {
  return await prisma.savingGoal.create({
    data: {
      name: data.name,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount ?? 0,
      deadline: data.deadline ? new Date(data.deadline) : null,
      categoryId: data.categoryId ?? null,
    },
    include: { category: true },
  })
}

export async function updateSavingGoal(id: string, data: Record<string, unknown>) {
  return await prisma.savingGoal.update({
    where: { id },
    data,
    include: { category: true },
  })
}

export async function deleteSavingGoal(id: string) {
  return await prisma.savingGoal.delete({ where: { id } })
}

export async function autoGenerateMonthlyIncome() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const incomeCategory = await prisma.category.findFirst({
    where: { name: 'Trabajo Técnico', type: 'INCOME', deletedAt: null },
  })
  if (!incomeCategory) return

  const existingAuto = await prisma.transaction.findFirst({
    where: {
      type: 'INCOME',
      categoryId: incomeCategory.id,
      date: { gte: startOfMonth, lte: endOfMonth },
      notes: 'Generado automáticamente del taller',
    },
  })
  if (existingAuto) return

  const totalLabor = await prisma.repair.aggregate({
    where: {
      status: 'DELIVERED',
      dateDelivered: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { laborCost: true },
  })

  const amount = totalLabor._sum.laborCost || 0
  if (amount <= 0) return

  const period = await getOrCreateActivePeriod()

  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      amount,
      description: `Ingresos del taller - ${startOfMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`,
      date: endOfMonth,
      categoryId: incomeCategory.id,
      periodId: period.id,
      notes: 'Generado automáticamente del taller',
    },
  })
}

export async function autoGenerateRecurringExpenses() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const period = await getOrCreateActivePeriod()

  const recurringTemplates = await prisma.transaction.findMany({
    where: { isRecurring: true, recurringDay: { not: null } },
    include: { category: true },
  })

  for (const template of recurringTemplates) {
    const existingThisMonth = await prisma.transaction.findFirst({
      where: {
        type: template.type,
        categoryId: template.categoryId,
        description: template.description,
        date: { gte: startOfMonth, lte: endOfMonth },
        notes: 'Gasto recurrente - generado automáticamente',
      },
    })
    if (existingThisMonth) continue

    const scheduledDay = Math.min(template.recurringDay || 1, endOfMonth.getDate())
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), scheduledDay)
    if (scheduledDate > endOfMonth) continue

    await prisma.transaction.create({
      data: {
        type: 'EXPENSE',
        amount: template.amount,
        description: template.description,
        date: scheduledDate,
        categoryId: template.categoryId,
        periodId: period.id,
        notes: 'Gasto recurrente - generado automáticamente',
      },
    })
  }
}