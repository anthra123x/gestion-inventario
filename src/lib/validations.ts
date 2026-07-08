import { z } from 'zod'

export const UserRoleSchema = z.enum(['ADMIN', 'EMPLOYEE'])
export const RepairStatusSchema = z.enum(['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'])
export const NotificationTypeSchema = z.enum(['REPAIR_READY', 'SYSTEM'])

export const CreateProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
  supplier: z.string().optional().nullable(),
  price: z.coerce.number().min(0, 'El precio debe ser positivo').default(0),
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const CreateClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  email: z.string().email('Email inválido').optional(),
  address: z.string().optional(),
})

export const UpdateClientSchema = CreateClientSchema.partial()

export const CreateRepairSchema = z.object({
  clientId: z.string(),
  device: z.string().min(2, 'El dispositivo debe tener al menos 2 caracteres'),
  problem: z.string().min(5, 'Describe el problema con al menos 5 caracteres'),
  diagnosis: z.string().optional().nullable(),
  laborCost: z.coerce.number().min(0, 'La mano de obra debe ser positiva').default(0),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  estimatedDate: z.string().optional().nullable(),
  parts: z
    .array(
      z.object({
        partId: z.string(),
        quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
        unitCost: z.coerce.number().min(0, 'El costo debe ser positivo'),
      }),
    )
    .optional(),
})

export const UpdateRepairSchema = z.object({
  status: RepairStatusSchema.optional(),
  diagnosis: z.string().optional().nullable(),
  laborCost: z.coerce.number().min(0, 'La mano de obra debe ser positiva').optional(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  estimatedDate: z.string().optional().nullable(),
  dateDelivered: z.string().optional().nullable(),
})

export const EditRepairSchema = z.object({
  clientName: z.string().optional(),
  clientPhone: z.string().optional().nullable(),
  clientEmail: z.string().email('Email inválido').optional().nullable(),
  clientAddress: z.string().optional().nullable(),
  device: z.string().min(2, 'El dispositivo debe tener al menos 2 caracteres'),
  problem: z.string().min(5, 'Describe el problema con al menos 5 caracteres'),
  diagnosis: z.string().optional().nullable(),
  laborCost: z.coerce.number().min(0, 'La mano de obra debe ser positiva').default(0),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  estimatedDate: z.string().optional().nullable(),
  status: RepairStatusSchema.optional(),
  parts: z
    .array(
      z.object({
        partId: z.string(),
        quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
        unitCost: z.coerce.number().min(0, 'El costo debe ser positivo'),
      }),
    )
    .optional(),
})

export const CreateNotificationSchema = z.object({
  userId: z.string().nullable().optional(),
  type: NotificationTypeSchema,
  title: z.string().min(1, 'El título es requerido'),
  message: z.string().optional().nullable(),
  entityType: z.string().optional().nullable(),
  entityId: z.string().optional().nullable(),
})

// Finance schemas
export const CategoryTypeSchema = z.enum(['INCOME', 'EXPENSE', 'SAVING_GOAL'])
export const TransactionTypeSchema = z.enum(['INCOME', 'EXPENSE'])

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  type: CategoryTypeSchema,
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  budget: z.coerce.number().min(0, 'El presupuesto debe ser positivo').optional().nullable(),
})

export const UpdateCategorySchema = CreateCategorySchema.partial()

export const CreateTransactionSchema = z.object({
  type: TransactionTypeSchema,
  amount: z.coerce.number().min(1, 'El monto debe ser mayor a 0'),
  description: z.string().min(2, 'La descripción debe tener al menos 2 caracteres'),
  date: z.string().optional(),
  categoryId: z.string(),
  isRecurring: z.boolean().optional().default(false),
  recurringDay: z.coerce.number().int().min(1).max(31).optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const UpdateTransactionSchema = CreateTransactionSchema.partial()

export const CreateSavingGoalSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  targetAmount: z.coerce.number().min(1, 'La meta debe ser mayor a 0'),
  currentAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
})

export const UpdateSavingGoalSchema = CreateSavingGoalSchema.partial()

export const BudgetPeriodStatusSchema = z.enum(['ACTIVE', 'CLOSED'])

export const CreateBudgetPeriodSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  initialBalance: z.coerce.number().min(0).default(0),
  notes: z.string().optional().nullable(),
})

export const CloseWeekSchema = z.object({
  savingsTarget: z.coerce.number().min(0).optional().nullable(),
})
