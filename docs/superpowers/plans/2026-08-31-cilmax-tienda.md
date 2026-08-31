# Cilmax — Transformación de Tienda: Plan de Implementación

> **Para agentes:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development o executing-plans para implementar tarea por tarea. Las steps usan checkbox `- [ ]`.

**Goal:** Transformar el ERP "Gestión Reparaciones" en "Cilmax", un sistema de gestión integral de tienda con inventario con stock, POS de ventas con facturación simple, proveedores, clientes, y finanzas ligadas a ventas y gastos.

**Architecture:** Se reescribe el modelo de datos (substituir Part/Repair por Product/ProductCategory/Supplier/StockMovement/Sale/SaleItem/Invoice/Expense), se eliminan roles de usuario (todos son admin), se crea un POS en /sales, se adapta la facturación PDF, y se actualizan dashboard/reportes a métricas de tienda. Se mantienen patrones existentes (Server Actions + Zod + tryCatch/Sentry, soft delete, componentes shadcn, export XLSX).

**Tech Stack:** Next.js 16.2.3 (App Router, webpack+WASM SWC), TypeScript strict, Prisma 5.22 + PostgreSQL (Supabase), @supabase/ssr + proxy.ts, Zod 4, shadcn/ui + Base UI, Tailwind v4, jsPDF + jspdf-autotable, xlsx, recharts, @sentry/nextjs, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-31-cilmax-tienda-design.md`

## Global Constraints

- DB: **Empezar de cero**. Dropear y recrear. Solo se conservan usuarios de Supabase Auth.
- `Product.stock` es la única fuente de verdad. Operaciones de stock SIEMPRE en `prisma.$transaction`.
- `salePrice >= costPrice`. No vender más unidades que el stock.
- Numeración de factura consecutiva auto con prefijo de /settings (`nextInvoiceNumber`).
- Snapshots de empresa por factura al emitir.
- Soft delete (deletedAt) para Product, ProductCategory, Supplier, Client; filtrar siempre `deletedAt: null`.
- Sin roles: cualquier usuario autenticado es admin.
- Comandos: `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` (todo usa webpack+WASM).
- Moneda con `formatCurrency` (COP). Errores con `parseError`/`tryCatch`. `router.push` no `window.location`. Dialog no `window.confirm`.

---

## Fase 1: Schema y modelo de datos

### Task 1: Reescribir schema.prisma

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Produce: modelos `User`, `Client`, `Product`, `ProductCategory`, `Supplier`, `StockMovement`, `Sale`, `SaleItem`, `Invoice`, `Expense`, `Category`, `BudgetPeriod`, `Transaction`, `SavingGoal`, `SystemSettings`, `Notification`, `AuditLog`. Enums `StockMovementType`, `PaymentMethod`, `SaleStatus`, `TransactionType`, `CategoryType`, `BudgetPeriodStatus`, `NotificationType`.

- [ ] **Step 1: Reescribir el schema completo** (ver spec / diseño). Modelos clave:

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sales     Sale[]
  expenses  Expense[]
  @@map("users")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  barcode     String?
  costPrice   Float    @default(0)
  salePrice   Float    @default(0)
  stock       Int      @default(0)
  lowStockThreshold Int @default(5)
  categoryId  String?
  category    ProductCategory? @relation(fields: [categoryId], references: [id])
  supplierId  String?
  supplier    Supplier? @relation(fields: [supplierId], references: [id])
  deletedAt   DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  stockMovements StockMovement[]
  saleItems      SaleItem[]
  @@index([name])
  @@index([deletedAt])
  @@index([categoryId])
  @@map("products")
}

model ProductCategory {
  id        String    @id @default(cuid())
  name      String
  color     String?
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  products  Product[]
  @@index([deletedAt])
  @@map("product_categories")
}

model Supplier {
  id        String    @id @default(cuid())
  name      String
  phone     String?
  email     String?
  address   String?
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  products  Product[]
  @@index([name])
  @@index([deletedAt])
  @@map("suppliers")
}

model StockMovement {
  id        String           @id @default(cuid())
  productId String
  type      StockMovementType
  quantity  Int
  unitCost  Float?
  reason    String?
  reference String?
  createdAt DateTime         @default(now())
  product   Product          @relation(fields: [productId], references: [id], onDelete: Cascade)
  @@index([productId])
  @@index([createdAt])
  @@map("stock_movements")
}

model Client {
  id        String   @id @default(cuid())
  name      String
  phone     String?
  email     String?
  address   String?
  deletedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sales     Sale[]
  @@index([phone])
  @@index([name])
  @@index([deletedAt])
  @@map("clients")
}

model Sale {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique
  clientId      String?
  client        Client?       @relation(fields: [clientId], references: [id])
  subtotal      Float
  discount      Float         @default(0)
  total         Float
  paymentMethod PaymentMethod
  status        SaleStatus    @default(COMPLETED)
  saleDate      DateTime      @default(now())
  userId        String?
  user          User?         @relation(fields: [userId], references: [id])
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  items         SaleItem[]
  invoice       Invoice?
  @@index([invoiceNumber])
  @@index([clientId])
  @@index([saleDate])
  @@map("sales")
}

model SaleItem {
  id        String  @id @default(cuid())
  saleId    String
  productId String
  quantity  Int
  unitPrice Float
  total     Float
  sale      Sale    @relation(fields: [saleId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])
  @@index([saleId])
  @@index([productId])
  @@map("sale_items")
}

model Invoice {
  id             String   @id @default(cuid())
  saleId         String   @unique
  sale           Sale     @relation(fields: [saleId], references: [id], onDelete: Cascade)
  invoiceNumber  String
  companyName    String
  companyAddress String?
  companyPhone   String?
  companyEmail   String?
  currency       String   @default("COP")
  invoiceFooter  String?
  createdAt      DateTime @default(now())
  @@index([saleId])
  @@map("invoices")
}

model Expense {
  id          String   @id @default(cuid())
  description String
  amount      Float
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  expenseDate DateTime @default(now())
  notes       String?
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@index([categoryId])
  @@index([expenseDate])
  @@map("expenses")
}

model SystemSettings {
  id                 String   @id @default(cuid())
  companyName        String   @default("Cilmax")
  companyAddress     String?
  companyPhone       String?
  companyEmail       String?
  currency           String   @default("COP")
  invoicePrefix      String   @default("CIL-")
  invoiceFooter      String?
  lowStockThreshold  Int      @default(5)
  nextInvoiceNumber  Int      @default(1)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  @@map("system_settings")
}
```

Y mantener: `Category`, `BudgetPeriod`, `Transaction` (añadir `saleId?` y `expenseId?`), `SavingGoal`, `Notification`, `AuditLog`. Transacción:

```prisma
model Transaction {
  id           String          @id @default(cuid())
  type         TransactionType
  amount       Float
  description  String
  date         DateTime        @default(now())
  categoryId   String
  category     Category        @relation(fields: [categoryId], references: [id])
  periodId     String?
  period       BudgetPeriod?   @relation(fields: [periodId], references: [id])
  saleId       String?
  expenseId    String?
  isRecurring  Boolean         @default(false)
  recurringDay Int?
  notes        String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  @@index([date])
  @@index([type])
  @@index([categoryId])
  @@index([periodId])
  @@map("transactions")
}
```

Enums:
```prisma
enum StockMovementType { PURCHASE SALE IN OUT ADJUST }
enum PaymentMethod { CASH CARD TRANSFER }
enum SaleStatus { COMPLETED CANCELLED }
enum NotificationType { SYSTEM LOW_STOCK }
```

- [ ] **Step 2: Actualizar seed.ts** — eliminar categorías legacy de taller; crear categorías de tienda (Ventas/Ingresos, Arriendo, Servicios, Proveedores/Compras, Sueldos, Transporte, Otros) y una categoría INCOME "Ventas Tienda".
- [ ] **Step 3: Regenerar Prisma Client**
Run: `npx prisma generate`
- [ ] **Step 4: Verificar typecheck**

Run: `npm run typecheck`
Expected: no debe referenciar Part/Repair (aún hay código que los usa → habrá errores; es aceptable temporalmente; se resuelven en fases 3-8).
- [ ] **Step 5: Commit** (solo schema + seed)

---

## Fase 2: Auth sin roles

### Task 2: Simplificar auth

**Files:**
- Modify: `src/modules/auth/auth.actions.ts` (quitar role, requireAdmin)
- Modify: `src/components/layout/sidebar.tsx` (quitar userRole y admin) 

**Interfaces:**
- `getCurrentUser(): Promise<User | null>` (sin role en select)
- `requireAuth(): Promise<User>` (redirect /login si no hay user)
- Se elimina `requireAdmin`, `getUsers`, `updateUserRole`, `createUserByAdmin` (la creación de usuarios se mantiene simple o se mueve a /settings)
- `ensureUserExists(email, name)` sin role

- [ ] **Step 1: Actualizar getCurrentUser** para quitar `role` del select.
- [ ] **Step 2: Eliminar requireAdmin** y funciones de roles (getUsers/updateUserRole/createUserByAdmin con rol). Confirmar que `createUserByAdmin` se mantiene pero crea usuario sin rol.
- [ ] **Step 3: Actualizar sidebar.tsx** — eliminar prop `userRole`, mostrar todas las rutas, cambiar branding a Cilmax (icono Store en vez de Wrench), y ajustar nav: Dashboard, Ventas `/sales`, Inventario `/inventory`, Clientes `/clients`, Finanzas `/finances`, Reportes `/reports`, Configuración `/settings`, Administración `/admin`.
- [ ] **Step 4: Actualizar dashboard-layout.tsx / header.tsx** para no pasar userRole y mostrar "Admin".

---

## Fase 3: Inventario completo

### Task 3: Módulo de productos con stock, categorías, proveedores, movimientos

**Files:**
- Modify: `src/modules/inventory/inventory.actions.ts` (reemplazar Part→Product, añadir stock/categoryId/supplierId/costPrice/salePrice)
- Create: `src/modules/inventory/categories.actions.ts`
- Create: `src/modules/suppliers/suppliers.actions.ts`
- Create: `src/modules/inventory/stock.actions.ts` (entradas de compra, ajustes)
- Modify: `src/lib/validations.ts` (CreateProductSchema/UpdateProduct con nuevos campos, ProductCategorySchema, SupplierSchema, StockMovementSchema)
- Modify: `src/components/forms/product-form.tsx` (campos stock/costPrice/salePrice/categoría/proveedor)
- Modify: `src/app/inventory/page.tsx`, `new`, `[id]`

**Interfaces:**
- `createProduct(formData)`, `updateProduct(id, formData)`, `deleteProduct(id)`, `getProducts(search,page,categoryId)`
- `createCategory/updateCategory/deleteCategory/getCategories`
- `createSupplier/updateSupplier/deleteSupplier/getSuppliers/searchSuppliers`
- `addStockMovement(productId, quantity, type, reason?)` — crea movimiento y actualiza stock en transacción
- `purchaseEntry(productId, quantity, unitCost)` — movimiento PURCHASE + aumentar stock + actualizar costPrice

- [ ] **Step 1: Actualizar validations.ts** — CreateProductSchema con name/description/barcode/costPrice/salePrice/stock/categoryId/supplierId + refinements (salePrice >= costPrice, stock >= 0). Schemas nuevos.
- [ ] **Step 2: Rehacer inventory.actions.ts** para Product con stock y filtro por categoría.
- [ ] **Step 3: Crear categories.actions.ts y suppliers.actions.ts.**
- [ ] **Step 4: Crear stock.actions.ts** con `addStockMovement`, `purchaseEntry`, `adjustStock`.
- [ ] **Step 5: Actualizar product-form.tsx** y páginas de inventario (tabla con stock/precio venta, categoría, proveedor).

---

## Fase 4: POS Ventas

### Task 4: Módulo de ventas + POS /sales

**Files:**
- Create: `src/modules/sales/sales.actions.ts`
- Create: `src/app/sales/page.tsx` (POS carrito)
- Create: `src/app/sales/layout.tsx`, `loading.tsx`, `error.tsx`
- Create: `src/app/sales/[id]/page.tsx` (detalle + imprimir factura)
- Create: `src/app/sales/history/page.tsx` (listado de ventas)
- Modify: `src/lib/validations.ts` (CreateSaleSchema, SaleItemSchema)

**Interfaces:**
- `createSale({ clientId?, items: {productId, quantity}[], discount, paymentMethod })` → transacción: valida stock, descuenta stock, crea Sale+SaleItems+Invoice, crea StockMovements SALE, incrementa nextInvoiceNumber, genera Transaction INCOME
- `cancelSale(saleId)` → devuelve stock, marca CANCELLED, crea StockMovement OUT
- `getSales(page, search, saleDateFilter)`, `getSaleById(id)` (include items.product, client, invoice)
- `getNextInvoiceNumber()` → `${prefix}${nextInvoiceNumber}`

- [ ] **Step 1: Crear sales.actions.ts** con el flujo transaccional completo.
- [ ] **Step 2: Crear POS page** (`/sales`) con carrito: búsqueda de productos, añadir item, cantidades, descuento, método de pago, total, botón cobrar.
- [ ] **Step 3: Crear detalle venta** (`/sales/[id]`) con botón imprimir factura.
- [ ] **Step 4: Crear historial de ventas** (`/sales/history` o integrado en /sales).

---

## Fase 5: Facturación PDF

### Task 5: Reescribir @/lib/pdf para factura de venta

**Files:**
- Modify: `src/lib/pdf.ts` (reemplazar generateRepairPdf → generateSaleInvoicePdf)
- Create: `src/app/api/sales/[id]/pdf/route.ts`
- Delete: `src/app/api/print/repair/[id]/pdf/route.ts` (en fase 8)

**Interfaces:**
- `generateSaleInvoicePdf(sale, settings, invoice): Uint8Array`

- [ ] **Step 1: Reescribir pdf.ts** para factura de venta (cabecera Cilmax, datos cliente, tabla items con cantidad/precio/total, subtotal/descuento/total, métodos de pago, footer).
- [ ] **Step 2: Crear API route** `/api/sales/[id]/pdf` para generar/descargar la factura PDF.

---

## Fase 6: Finanzas ligadas a ventas + gastos de tienda

### Task 6: Gastos de tienda y vínculo con ventas

**Files:**
- Create: `src/modules/finance/expenses.actions.ts`
- Modify: `src/modules/finance/finance.actions.ts` (getFinanceSummary ya liga ventas; mantener)
- Modify: `src/app/finances/page.tsx` (tab nueva/sección de gastos de tienda)

**Interfaces:**
- `createExpense(formData)` → crea Expense + genera Transaction EXPENSE automáticamente
- `updateExpense`, `deleteExpense`, `getExpenses(page, filters)`

- [ ] **Step 1: Crear expenses.actions.ts**.
- [ ] **Step 2: Añadir UI de gastos de tienda** en finanzas.

---

## Fase 7: Dashboard + Reportes

### Task 7: Dashboard y reportes de tienda

**Files:**
- Modify: `src/modules/dashboard/dashboard.actions.ts`
- Modify: `src/app/dashboard/page.tsx`, `charts.tsx`
- Modify: `src/modules/reports/reports.actions.ts`
- Modify: `src/app/reports/page.tsx`

**Interfaces:**
- `getDashboardStats()` → ventas hoy, ingresos hoy, productos con stock bajo, clientes, ventas por mes, top productos, ventas por método de pago
- Reportes: `getSalesReport(filters)`, `getInventoryReport(filters)`, `getClientsReport(filters)` (adaptado sin reparaciones)
- `generateReportData(reportType, filters)` → 'sales' | 'inventory' | 'clients'

- [ ] **Step 1: Reescribir dashboard.actions.ts** con métricas de tienda.
- [ ] **Step 2: Actualizar dashboard page/charts.**
- [ ] **Step 3: Reescribir reports.actions.ts** y página de reportes (ventas/inventario/clientes, export Excel/PDF).

---

## Fase 8: Limpieza

### Task 8: Eliminar reparaciones y dependencias

**Files:**
- Delete: `src/app/repairs/`, `src/app/print/repair/`, `src/modules/repairs/`
- Delete: `src/app/api/print/repair/`
- Modify: `src/modules/cleanup/cleanup.actions.ts`, `src/modules/export/export.actions.ts`
- Modify: `src/lib/labels.ts`, `src/lib/pdf.ts`
- Modify: `src/modules/notifications/notifications.actions.ts`
- Remove tests legacy de repairs (o adaptar)

- [ ] **Step 1: Borrar módulos de reparaciones** (app/repairs, print/repair, modules/repairs).
- [ ] **Step 2: Actualizar export/cleanup** (productos/ventas/clientes).
- [ ] **Step 3: Limpiar labels.ts y pdf.ts** de referencias a reparaciones.

---

## Fase 9: Verificación

### Task 9: Verificación completa

**Files:**
- Todo el proyecto

- [ ] **Step 1: `npm run typecheck`** — sin errores.
- [ ] **Step 2: `npm run lint`** — sin errores.
- [ ] **Step 3: `npm run test`** — tests pasan (actualizar tests legacy de repairs).
- [ ] **Step 4: `npm run build`** — build exitoso.
- [ ] **Step 5: `npx prettier --write src/`** — formatear.

---

## Self-Review del plan

- **Spec coverage:** Todas las decisiones del spec están cubiertas por una fase/task (schema, auth sin roles, inventario con stock, POS, factura PDF, finanzas, dashboard/reportes, limpieza, verificación). La decisión "empezar de cero" se refleja en que no hay migraciones de datos. ✓
- **Placeholder scan:** Pasos concretos con código y comandos. ✓
- **Type consistency:** `createSale/cancelSale/getSaleById`, `addStockMovement/purchaseEntry`, `generateSaleInvoicePdf` son consistentes entre tareas. ✓
