import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function getCategories(type?: string) {
  const where: Prisma.CategoryWhereInput = { deletedAt: null }
  if (type) where.type = type as 'INCOME' | 'EXPENSE' | 'SAVING_GOAL'
  return await prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
  })
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

export async function updateCategory(
  id: string,
  data: {
    name?: string
    type?: 'INCOME' | 'EXPENSE' | 'SAVING_GOAL'
    color?: string | null
    icon?: string | null
    budget?: number | null
  },
) {
  return await prisma.category.update({ where: { id }, data })
}

export async function deleteCategory(id: string) {
  return await prisma.category.update({
    where: { id },
    data: { deletedAt: new Date() },
  })
}

export type TransactionFilters = {
  type?: 'INCOME' | 'EXPENSE'
  categoryId?: string
  startDate?: string
  endDate?: string
  isRecurring?: boolean
  page?: number
  pageSize?: number
}

export async function getTransactions(filters: TransactionFilters = {}) {
  const where: Prisma.TransactionWhereInput = {}
  if (filters.type) where.type = filters.type
  if (filters.categoryId) where.categoryId = filters.categoryId
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
      include: { category: true },
      orderBy: { date: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
  ])

  return { items, total, page, totalPages: Math.ceil(total / pageSize) }
}

export async function getTransactionById(id: string) {
  return await prisma.transaction.findUnique({
    where: { id },
    include: { category: true },
  })
}

export async function createTransaction(data: {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  description: string
  date?: string | Date
  categoryId: string
  isRecurring?: boolean
  recurringDay?: number | null
  notes?: string | null
}) {
  return await prisma.transaction.create({
    data: {
      type: data.type,
      amount: data.amount,
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
      categoryId: data.categoryId,
      isRecurring: data.isRecurring ?? false,
      recurringDay: data.recurringDay ?? null,
      notes: data.notes ?? null,
    },
    include: { category: true },
  })
}

export async function updateTransaction(
  id: string,
  data: {
    type?: 'INCOME' | 'EXPENSE'
    amount?: number
    description?: string
    date?: string | Date
    categoryId?: string
    isRecurring?: boolean
    recurringDay?: number | null
    notes?: string | null
  },
) {
  const updateData: Prisma.TransactionUpdateInput = {}
  if (data.type !== undefined) updateData.type = data.type
  if (data.amount !== undefined) updateData.amount = data.amount
  if (data.description !== undefined) updateData.description = data.description
  if (data.date !== undefined) updateData.date = new Date(data.date)
  if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } }
  if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring
  if (data.recurringDay !== undefined) updateData.recurringDay = data.recurringDay
  if (data.notes !== undefined) updateData.notes = data.notes

  return await prisma.transaction.update({
    where: { id },
    data: updateData,
    include: { category: true },
  })
}

export async function deleteTransaction(id: string) {
  return await prisma.transaction.delete({ where: { id } })
}

export type FinanceSummary = {
  totalIncome: number
  totalExpenses: number
  balance: number
  incomeByCategory: { category: string; amount: number; color: string | null }[]
  expenseByCategory: { category: string; amount: number; color: string | null }[]
  monthlyData: { month: string; income: number; expenses: number }[]
  recentTransactions: Awaited<ReturnType<typeof getTransactions>>['items']
  savingGoals: Awaited<ReturnType<typeof getSavingGoals>>
}

export async function getFinanceSummary(): Promise<FinanceSummary> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  const startOfYear = new Date(now.getFullYear(), 0, 1)
  const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59)

  const [monthlyIncomeAgg, monthlyExpenseAgg, monthlyAgg, recentTransactions, savingGoals] =
    await Promise.all([
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'INCOME', date: { gte: startOfMonth, lte: endOfMonth } },
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'EXPENSE', date: { gte: startOfMonth, lte: endOfMonth } },
      }),
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
    ])

  const totalIncome = monthlyIncomeAgg._sum.amount || 0
  const totalExpenses = monthlyExpenseAgg._sum.amount || 0

  const categoryIds = monthlyAgg.map((g) => g.categoryId)
  const categories = categoryIds.length > 0
    ? await prisma.category.findMany({ where: { id: { in: categoryIds } } })
    : []
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  const incomeByCategory = monthlyAgg
    .filter((g) => g.type === 'INCOME')
    .map((g) => ({
      category: categoryMap.get(g.categoryId)?.name || 'Sin categoría',
      amount: g._sum.amount || 0,
      color: categoryMap.get(g.categoryId)?.color || null,
    }))

  const expenseByCategory = monthlyAgg
    .filter((g) => g.type === 'EXPENSE')
    .map((g) => ({
      category: categoryMap.get(g.categoryId)?.name || 'Sin categoría',
      amount: g._sum.amount || 0,
      color: categoryMap.get(g.categoryId)?.color || null,
    }))

  const monthlyTransactions = await prisma.transaction.findMany({
    where: { date: { gte: startOfYear, lte: endOfYear } },
    select: { type: true, amount: true, date: true },
    orderBy: { date: 'asc' },
  })

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
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, data]) => ({
    month,
    ...data,
  }))

  return {
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
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

export async function updateSavingGoal(
  id: string,
  data: {
    name?: string
    targetAmount?: number
    currentAmount?: number
    deadline?: string | null
    categoryId?: string | null
  },
) {
  const updateData: Record<string, unknown> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.targetAmount !== undefined) updateData.targetAmount = data.targetAmount
  if (data.currentAmount !== undefined) updateData.currentAmount = data.currentAmount
  if (data.deadline !== undefined) updateData.deadline = data.deadline ? new Date(data.deadline) : null
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId

  return await prisma.savingGoal.update({
    where: { id },
    data: updateData,
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

  await prisma.transaction.create({
    data: {
      type: 'INCOME',
      amount,
      description: `Ingresos del taller - ${startOfMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}`,
      date: endOfMonth,
      categoryId: incomeCategory.id,
      notes: 'Generado automáticamente del taller',
    },
  })
}

export async function autoGenerateRecurringExpenses() {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const recurringTemplates = await prisma.transaction.findMany({
    where: {
      isRecurring: true,
      recurringDay: { not: null },
    },
    include: { category: true },
  })

  for (const template of recurringTemplates) {
    const existingThisMonth = await prisma.transaction.findFirst({
      where: {
        type: template.type,
        categoryId: template.categoryId,
        description: template.description,
        date: { gte: startOfMonth, lte: endOfMonth },
        notes: `Gasto recurrente - generado automáticamente`,
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
        notes: 'Gasto recurrente - generado automáticamente',
      },
    })
  }
}