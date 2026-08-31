'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/modules/auth/auth.actions'
import { parseError } from '@/lib/errors'

export async function createExpense(data: {
  description: string
  amount: number
  categoryId: string
  expenseDate?: Date
  notes?: string
}) {
  const user = await requireAuth()

  try {
    const result = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          description: data.description,
          amount: data.amount,
          categoryId: data.categoryId,
          expenseDate: data.expenseDate || new Date(),
          notes: data.notes || null,
          userId: user.id,
        },
      })

      // Create matching expense transaction
      await tx.transaction.create({
        data: {
          type: 'EXPENSE',
          amount: data.amount,
          description: data.description,
          categoryId: data.categoryId,
          expenseId: expense.id,
          date: data.expenseDate || new Date(),
        },
      })

      return expense
    })

    revalidatePath('/finances')
    revalidatePath('/dashboard')
    return { success: 'Gasto registrado exitosamente', expense: result }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function updateExpense(
  id: string,
  data: {
    description?: string
    amount?: number
    categoryId?: string
    expenseDate?: Date
    notes?: string
  },
) {
  await requireAuth()

  try {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        description: data.description,
        amount: data.amount,
        categoryId: data.categoryId,
        expenseDate: data.expenseDate,
        notes: data.notes,
      },
    })

    revalidatePath('/finances')
    return { success: 'Gasto actualizado', expense }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function deleteExpense(id: string) {
  await requireAuth()

  try {
    await prisma.expense.delete({ where: { id } })
    revalidatePath('/finances')
    return { success: 'Gasto eliminado' }
  } catch (error) {
    return { error: parseError(error).message }
  }
}

export async function getExpenses(page = 1, take = 20) {
  await requireAuth()

  const where = {}

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
      skip: (page - 1) * take,
      take,
      include: {
        category: { select: { id: true, name: true, color: true } },
        user: { select: { id: true, name: true } },
      },
    }),
    prisma.expense.count({ where }),
  ])

  return {
    expenses,
    total,
    page,
    totalPages: Math.ceil(total / take),
  }
}
