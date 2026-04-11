import { User, Product, Client, Sale, Repair, UserRole, ProductCategory, RepairStatus, PaymentMethod } from '@prisma/client'

export type {
  User,
  Product,
  Client,
  Sale,
  Repair,
  UserRole,
  ProductCategory,
  RepairStatus,
  PaymentMethod
}

export interface SaleWithItems extends Sale {
  saleItems: {
    id: string
    quantity: number
    unitPrice: number
    total: number
    product: Product
  }[]
  client?: Client | null
}

export interface RepairWithParts extends Repair {
  repairParts: {
    id: string
    quantity: number
    unitCost: number
    total: number
    product: Product
  }[]
  client: Client
}

export interface ProductWithMovements extends Product {
  inventoryMovements: {
    id: string
    type: 'ENTRY' | 'EXIT'
    quantity: number
    reason: string | null
    createdAt: Date
    user?: {
      name: string
    } | null
  }[]
}

export interface DashboardStats {
  totalSales: number
  totalRevenue: number
  activeRepairs: number
  lowStockProducts: number
  recentSales: SaleWithItems[]
  topProducts: {
    product: Product
    totalSold: number
  }[]
  salesByMonth: {
    month: string
    total: number
  }[]
}
