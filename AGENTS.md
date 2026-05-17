<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tecnicell ERP — Contexto para el Agente

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.3 (App Router) |
| Language | TypeScript strict |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 5.22 |
| CSS | Tailwind CSS v4 |
| UI Library | shadcn/ui + Radix primitives |
| Auth | Supabase Auth (SSR) |
| Validation | Zod 4 |
| PDF | jsPDF + pdf-lib |
| Charts | Recharts |

## Comandos básicos

```bash
npm run dev         # Iniciar dev server (http://localhost:3000)
npm run build       # Prisma generate + Next build
npm run lint        # ESLint
npm run db:push     # Sincronizar schema Prisma con DB (dev)
npm run db:studio   # Abrir Prisma Studio
npm run db:migrate  # Crear migración
```

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Panel de administración
│   ├── api/                # API routes (públicas)
│   │   ├── ecommerce/products/  # Storefront API
│   │   ├── orders/              # Order CRUD
│   │   └── products/            # Product API (legacy)
│   ├── dashboard/          # Dashboard (inicio)
│   ├── ecommerce/          # Admin catálogo online
│   │   └── products/[id]/  # Editor de producto ecommerce
│   ├── inventory/          # Gestión de inventario
│   ├── orders/             # Pedidos online
│   ├── repairs/            # Reparaciones
│   ├── reports/            # Reportes
│   └── sales/              # Ventas POS
├── components/
│   ├── forms/              # Formularios (sale-form, etc.)
│   ├── layout/             # Sidebar, Header, DashboardLayout
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilidades, validaciones, finanzas
│   ├── validations.ts      # Zod schemas (todos los módulos)
│   ├── finance.ts          # Cálculos financieros
│   ├── prisma.ts           # Prisma Client singleton
│   └── format.ts           # Formateo de moneda/fechas
├── modules/                # Server actions (negocio)
│   ├── auth/               # Autenticación
│   ├── clients/            # Clientes
│   ├── dashboard/          # Estadísticas dashboard
│   ├── ecommerce/          # Catálogo online CRUD
│   ├── inventory/          # Productos y stock
│   ├── orders/             # Pedidos online
│   ├── repairs/            # Reparaciones
│   ├── reports/            # Reportes
│   ├── sales/              # Ventas POS
│   └── settings/           # Configuración del sistema
└── middleware.ts            # Supabase Auth middleware
```

## Convenciones de código

- **Server Actions**: En `src/modules/<modulo>/<modulo>.actions.ts`, usar `'use server'`
- **API Routes**: En `src/app/api/<ruta>/route.ts`, sin auth (públicas)
- **Páginas**: Componentes Server Component por defecto, `'use client'` solo cuando sea necesario
- **Validación**: Siempre con Zod, schemas en `src/lib/validations.ts`
- **Errores Prisma**: Capturar P2002 (unique), P2025 (not found), P2003 (FK)
- **Stock**: Siempre usar `prisma.$transaction()` para operaciones que modifican stock
- **Formateo monetario**: Usar `formatCurrency()` de `@/lib/format`
- **Cálculos financieros**: Usar helpers de `@/lib/finance` (calcSubtotal, calcTotal, calcProfit, etc.)
- **CSS**: Tailwind utility classes, evitar CSS modules

## Módulos clave

| Módulo | Server Actions | Archivo Principal |
|--------|---------------|-------------------|
| Inventario | `inventory.actions.ts` | CRUD productos, movimientos de stock |
| Ventas POS | `sales.actions.ts` | Crear venta, descuentos, validación no-pérdida |
| Pedidos online | `orders.actions.ts` | CRUD pedidos, transiciones de estado con side effects de stock |
| Ecommerce | `ecommerce.actions.ts` | Catálogo online, imágenes, badges, precios |
| Reparaciones | `repairs.actions.ts` | CRUD reparaciones, gestión de partes, stock |
| Reportes | `reports.actions.ts` | Reportes de ventas, inventario, reparaciones, clientes |

## Reglas de negocio importantes

1. **Stock**: `Product.stock` es la única fuente de verdad. Storefront NO escribe stock.
2. **Ventas**: No se puede vender por debajo del costo (`unitPrice >= purchasePrice`).
3. **Reparaciones**: El costo de mano de obra (`cost`) debe ser >= el costo de partes (`partsCost`).
4. **Pedidos online**: El stock se descuenta en `PENDING → CONFIRMED`, no al crear el pedido.
5. **Soft delete**: Productos y clientes tienen `deletedAt`. Siempre filtrar `deletedAt: null` en queries.
6. **Enums**: Todos en UPPERCASE. La DB tiene datos legacy en lowercase.

## Documentación compartida

Hay un submodule en `docs/` que apunta a `github.com/anthra123x/tecnicell-docs`. Esta documentación cubre la integración con el storefront.

**Leer primero:**
- `docs/docs/architecture/00-SYSTEM_OVERVIEW.md` — Visión general
- `docs/docs/architecture/01-SHARED_DATABASE.md` — Base de datos compartida
- `docs/docs/architecture/03-ORDER_FLOW.md` — Flujo de pedidos (crítico: stock side effects)

**Actualizar docs:**
```bash
cd docs
git checkout main
# editar...
git add . && git commit -m "mensaje" && git push origin main
cd ..
git add docs && git commit -m "docs: sync submodule" && git push
```

**Recibir cambios:**
```bash
git submodule update --remote docs
git add docs && git commit -m "docs: sync submodule" && git push
```

## Notas sobre la integración con Storefront

- Ambos proyectos comparten la misma DB PostgreSQL en Supabase.
- El storefront lee productos via `GET /api/ecommerce/products` (API) o directo a DB.
- El storefront escribe pedidos via `POST /api/orders` (local o API del ERP).
- El storefront NUNCA escribe stock, productos, ni datos de ecommerce.
- Los modelos `EcommerceProduct` y `ProductMedia` están en `product_ecommerce` y `product_media`.
