import { z } from 'zod'

export const UserRoleSchema = z.enum(['ADMIN', 'EMPLOYEE'])
export const ProductCategorySchema = z.enum(['ACCESSORY', 'REPAIR_PART', 'DEVICE', 'OTHER'])
export const RepairStatusSchema = z.enum(['RECEIVED', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED'])
export const PaymentMethodSchema = z.enum(['CASH', 'CARD', 'TRANSFER'])
export const MovementTypeSchema = z.enum(['ENTRY', 'EXIT'])

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  role: UserRoleSchema.default('EMPLOYEE'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
})

export const UpdateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  role: UserRoleSchema.optional()
})

// Product schemas
export const CreateProductSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional().nullable(),
  category: ProductCategorySchema,
  stock: z.coerce.number().int().min(0, 'El stock debe ser un número positivo'),
  minStock: z.coerce.number().int().min(0, 'El stock mínimo debe ser un número positivo'),
  purchasePrice: z.coerce.number().min(0, 'El precio de compra debe ser positivo'),
  salePrice: z.coerce.number().min(0, 'El precio de venta debe ser positivo'),
  supplier: z.string().optional().nullable(),
  barcode: z.string().optional().nullable()
})

export const UpdateProductSchema = CreateProductSchema.partial()

export const InventoryMovementSchema = z.object({
  productId: z.string(),
  type: MovementTypeSchema,
  quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
  reason: z.string().optional()
})

// Client schemas
export const CreateClientSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().min(8, 'El teléfono debe tener al menos 8 caracteres'),
  email: z.string().email('Email inválido').optional(),
  address: z.string().optional()
})

export const UpdateClientSchema = CreateClientSchema.partial()

// Sale schemas
export const CreateSaleSchema = z.object({
  clientId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1'),
    unitPrice: z.number().min(0, 'El precio debe ser positivo')
  })).min(1, 'Debe agregar al menos un producto'),
  paymentMethod: PaymentMethodSchema,
  notes: z.string().optional()
})

// Repair schemas
export const CreateRepairSchema = z.object({
  clientId: z.string(),
  device: z.string().min(2, 'El dispositivo debe tener al menos 2 caracteres'),
  problem: z.string().min(5, 'Describe el problema con al menos 5 caracteres'),
  diagnosis: z.string().optional().nullable(),
  cost: z.coerce.number().min(0, 'El costo debe ser positivo').default(0),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  estimatedDate: z.string().optional().nullable(),
  parts: z.array(z.object({
    productId: z.string(),
    quantity: z.coerce.number().int().min(1, 'La cantidad debe ser al menos 1'),
    unitCost: z.coerce.number().min(0, 'El costo debe ser positivo')
  })).optional()
})

export const UpdateRepairSchema = z.object({
  status: RepairStatusSchema.optional(),
  diagnosis: z.string().optional().nullable(),
  cost: z.coerce.number().min(0, 'El costo debe ser positivo').optional(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  estimatedDate: z.string().optional().nullable(),
  dateDelivered: z.string().optional().nullable()
})

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
})

export const RegisterSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres')
})

// Report schemas
export const ReportFiltersSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.enum(['sales', 'inventory', 'repairs', 'clients']).optional(),
  category: ProductCategorySchema.optional(),
  status: RepairStatusSchema.optional()
})
