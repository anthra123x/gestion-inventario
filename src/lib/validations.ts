import { z } from 'zod'

// Notification schemas
export const NotificationTypeSchema = z.enum(['SYSTEM', 'LOW_STOCK'])

// Product schemas
export const CreateProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
  barcode: z.string().optional().nullable(),
  costPrice: z.coerce.number().min(0, 'El costo debe ser positivo').default(0),
  salePrice: z.coerce.number().min(0, 'El precio de venta debe ser positivo').default(0),
  stock: z.coerce.number().int().min(0, 'El stock no puede ser negativo').default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  categoryId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
})

export const UpdateProductSchema = CreateProductSchema.partial()

// Product Category schemas
export const CreateProductCategorySchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  color: z.string().optional().nullable(),
})

export const UpdateProductCategorySchema = CreateProductCategorySchema.partial()

// Supplier schemas
export const CreateSupplierSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  address: z.string().optional().nullable(),
})

export const UpdateSupplierSchema = CreateSupplierSchema.partial()

// Stock Movement schemas
export const StockMovementTypeSchema = z.enum(['PURCHASE', 'SALE', 'IN', 'OUT', 'ADJUST'])

export const CreateStockMovementSchema = z.object({
  productId: z.string().min(1, 'El producto es requerido'),
  type: StockMovementTypeSchema,
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
  unitCost: z.coerce.number().min(0).optional().nullable(),
  reason: z.string().optional().nullable(),
  reference: z.string().optional().nullable(),
})

// Sale schemas
export const PaymentMethodSchema = z.enum(['CASH', 'CARD', 'TRANSFER'])
export const SaleStatusSchema = z.enum(['COMPLETED', 'CANCELLED'])

export const CreateSaleItemSchema = z.object({
  productId: z.string().min(1, 'El producto es requerido'),
  quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
})

export const CreateSaleSchema = z.object({
  clientId: z.string().optional().nullable(),
  items: z.array(CreateSaleItemSchema).min(1, 'Debe agregar al menos un producto'),
  discount: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
  paymentMethod: PaymentMethodSchema,
})

// Client schemas
export const CreateClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  email: z.string().email('Email inválido').optional(),
  address: z.string().optional(),
})

export const UpdateClientSchema = CreateClientSchema.partial()

// Notification schemas
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

// Auth schemas
export const ChangePasswordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

// Settings schemas
export const UpdateSettingsSchema = z.object({
  companyName: z.string().min(1, 'El nombre es requerido').optional(),
  companyAddress: z.string().optional().nullable(),
  companyPhone: z.string().optional().nullable(),
  companyEmail: z.string().email('Email inválido').optional().nullable(),
  currency: z.string().optional(),
  invoicePrefix: z.string().optional(),
  invoiceFooter: z.string().optional().nullable(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
})
