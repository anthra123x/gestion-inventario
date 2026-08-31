# Cilmax — Sistema de Gestión Integral de Tienda

## Propósito

Transformar el ERP "Gestión Reparaciones" (sistema de taller de reparaciones) en
un sistema de gestión integral de tienda llamado **Cilmax**. Cilmax es una tienda
que vende "casi de todo". La dueña factura ventas normales de contado, descontando
stock del inventario de forma automática. Se elimina por completo el dominio de
reparaciones.

## Decisiones confirmadas con el usuario

| # | Decisión |
|---|----------|
| 1 | POS/facturación normal de contado que descuenta stock automáticamente |
| 2 | Eliminar por completo el módulo de reparaciones |
| 3 | Inventario con productos con stock completo (entradas de compra + ventas) |
| 4 | Registrar proveedores con trazabilidad de compras |
| 5 | Solo ventas de contado; clientes para datos de contacto + historial |
| 6 | Factura simple (no DIAN), precio final sin IVA separado, moneda COP |
| 7 | Finanzas ligadas a ventas + gastos operativos de tienda |
| 8 | Mantener login/registro, QUITAR roles (todos son admin) |
| 9 | Nombre del sistema: "Cilmax" (configurable desde /settings) |
| 10 | Numeración consecutiva automática con prefijo configurable |
| 11 | **Snapshot de empresa por factura** (cada factura guarda copia fija de datos de empresa al emitirse) |
| 12 | **Reutilizar categorías existentes** de finanzas para gastos operativos |
| 13 | **Sí, cancelar venta** (devuelve stock, registra movimiento, anula la venta) |
| 14 | **Empezar de cero**: dropear DB y recrear; solo se conservan usuarios de Supabase Auth |

## Stack tecnológico (sin cambios)

Next.js 16.2.3 (App Router, `--webpack` + WASM SWC), TypeScript strict,
Prisma 5.22 + PostgreSQL (Supabase), @supabase/ssr con proxy.ts, Zod 4,
shadcn/ui + Base UI, Tailwind v4, jsPDF + jspdf-autotable (facturas PDF),
xlsx (SheetJS), recharts, @sentry/nextjs, Vitest.

## Modelo de datos (schema.prisma)

### Enums nuevos

```
StockMovementType { PURCHASE, SALE, IN, OUT, ADJUST }
PaymentMethod     { CASH, CARD, TRANSFER }
SaleStatus        { COMPLETED, CANCELLED }
```

### Enums eliminados
`UserRole`, `RepairStatus`. `NotificationType` se simplifica (se quitan los
tipos de reparación).

### Modelos

**User** (modificado) — sin `role`; solo id/email/name/createdAt/updatedAt.
Relaciones: sales, expenses (por usuario).

**Product** (reemplaza a Part)
- id, name, description?, barcode?, costPrice Float, salePrice Float,
  stock Int, lowStockThreshold Int @default(5), categoryId?, supplierId?,
  deletedAt?, createdAt, updatedAt
- Relaciones: category, supplier, stockMovements, saleItems
- `@@index([name])`, `@@index([deletedAt])`, `@@index([categoryId])`

**ProductCategory**
- id, name, color?, deletedAt?, createdAt, updatedAt
- Relación: products

**Supplier**
- id, name, phone?, email?, address?, deletedAt?, createdAt, updatedAt
- Relación: products. `@@index([name])`, `@@index([deletedAt])`

**StockMovement**
- id, productId, type StockMovementType, quantity Int, unitCost?,
  reason?, reference?, createdAt
- Relación: product (Cascade)
- `@@index([productId])`, `@@index([createdAt])`

**Client** (modificado) — se conserva igual (name/phone/email/address/deletedAt),
pero la relación `repairs` se reemplaza por `sales`.

**Sale**
- id, invoiceNumber @unique, clientId?, subtotal Float, discount Float
  @default(0), total Float, paymentMethod PaymentMethod, status SaleStatus
  @default(COMPLETED), saleDate, createdAt, updatedAt, userId?
- Relaciones: client (opcional), items, invoice, stockMovements
- `@@index([invoiceNumber])`, `@@index([clientId])`, `@@index([saleDate])`

**SaleItem**
- id, saleId, productId, quantity Int, unitPrice Float, total Float
- Relaciones: sale (Cascade), product
- `@@index([saleId])`, `@@index([productId])`

**Invoice** (factura simple, snapshot de empresa)
- id, saleId (relación 1-1 única), invoiceNumber, companyName,
  companyAddress?, companyPhone?, companyEmail?, currency @default("COP"),
  invoiceFooter?, createdAt
- `@@index([saleId])`

**Expense**
- id, description, amount Float, categoryId, expenseDate, notes?,
  createdAt, updatedAt, userId?
- Relación: category
- `@@index([categoryId])`, `@@index([expenseDate])`

**Transaction** (modificado) — añadir `saleId?` (ingreso automático desde venta)
y `expenseId?` opcional. Mantener type/amount/description/categoryId/periodId/
isRecurring/recurringDay/notes.

**Category, BudgetPeriod, SavingGoal** — sin cambios.

**SystemSettings** (modificado para tienda)
- id, companyName @default("Cilmax"), companyAddress?, companyPhone?,
  companyEmail?, currency @default("COP"), invoicePrefix @default("CIL-"),
  invoiceFooter?, lowStockThreshold Int @default(5),
  nextInvoiceNumber Int @default(1), createdAt, updatedAt
- Se eliminan: receiptTitle, receiptTagline, warrantyText,
  defaultWarrantyDays

**AuditLog, Notification** — se mantienen (AuditLog sin cambios;
Notification se adapta).

## Estrategia de migración de datos

**Empezar de cero.** Se dropea la base de datos y se recrea limpia con el nuevo
schema. Se conservan únicamente los usuarios de Supabase Auth (los que ya tienen
una cuenta en el proyecto). Los datos del taller (reparaciones, repuestos,
historial financiero legacy) se descartan. La empresa/negocio se configura
desde el panel /settings al iniciar.

## Módulos de backend (server actions + servicios)

Se mantiene el patrón de Server Actions con validación Zod y `tryCatch`/`parseError`
con Sentry.

- **inventory**: CRUD productos (con stock, categorías, proveedores), entradas
  de compra (movimiento PURCHASE + actualizar stock), movimientos de stock,
  ajustes de stock.
- **suppliers**: CRUD proveedores.
- **sales** (nuevo): crear venta (transacción: valida y descuenta stock,
  registra SaleItems, genera Invoice, crea StockMovements SALE), anular venta
  (devuelve stock, movimiento OUT, venta CANCELLED, genera Transaction),
  listar ventas/paginado, detalle venta, numeración secuencial desde settings.
- **finances**: ligar Transaction a ventas (ingreso automático) y a gastos.
  Gasto de tienda (Expense) genera Transaction EXPENSE automáticamente.
- **clients**: CRUD clientes (igual que hoy, sin reparaciones).
- **auth**: sin roles; getCurrentUser/requireAuth; se elimina requireAdmin y la
  distinción admin/employee.
- **reports**: reportes de ventas, inventario, clientes.
- **dashboard**: métricas de tienda (ventas hoy, ingresos, stock bajo, clientes).
- **export**: exportación a Excel de productos/ventas/clientes/gastos + PDF factura.
- **settings**: configuración de tienda.
- **notifications / audit / cleanup**: se adaptan.

## Frontend / UI

- **Sidebar** (sin roles): Dashboard `/dashboard`, Ventas `/sales` (POS),
  Inventario `/inventory`, Clientes `/clients`, Finanzas `/finances`,
  Reportes `/reports`, Configuración `/settings`.
- **Nuevo POS** en `/sales`: carrito con búsqueda de productos, cantidades,
  descuento, método de pago, total, botón cobrar → registra venta y descuenta
  stock, genera factura imprimible en PDF.
- **Ventas**: listado de ventas con detalle y botón imprimir factura PDF,
  botón anular venta (con Dialog de confirmación).
- **Inventario**: productos con stock, categorías, proveedores, entradas de
  compra (crear producto + aumentar stock), movimientos, ajuste de stock.
- Se reutilizan los 23 componentes UI existentes, PageHeader, DashboardLayout,
  StatCard/StatCardGrid, EmptyState, Skeleton, Pagination, Dialog.
- **Factura PDF**: se reescribe `@/lib/pdf` para generar factura de venta
  (reemplaza generarRepairPdf).

## Reglas de negocio Cilmax

1. `Product.stock` es la única fuente de verdad del inventario.
2. Toda operación que modifica stock debe ir en `prisma.$transaction`.
3. `salePrice >= costPrice` — no vender por debajo del costo (validación Zod).
4. No vender más unidades que el stock disponible (validación en venta).
5. Numeración de factura consecutiva automática con prefijo de /settings.
6. Las ventas canceladas devuelven stock.
7. Soft delete para Product, ProductCategory, Supplier, Client (deletedAt; filtrar siempre).
8. Sin roles: cualquier usuario autenticado es administrador del sistema.

## Fuera de alcance

- Facturación electrónica / DIAN / IVA.
- Ventas a crédito.
- Módulo ecommerce / tienda online.
- Roles y permisos.
