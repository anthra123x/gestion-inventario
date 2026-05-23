<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Tecnicell ERP — Contexto Completo para el Agente

## Stack tecnológico

| Capa | Tecnología | Versión | Notas |
|------|-----------|---------|-------|
| Framework | Next.js (App Router) | 16.2.3 | Turbopack build |
| Language | TypeScript | 5.x | `strict: true` |
| Database | PostgreSQL (Supabase) | - | PgBouncer pooler |
| ORM | Prisma | 5.22 | Singleton en `@/lib/prisma` |
| CSS | Tailwind CSS | 4.x | `@tailwindcss/postcss`, `@theme inline` |
| UI Components | shadcn/ui + Base UI v1 | - | `base-nova` style, lucide icons |
| Auth | Supabase Auth (SSR) | - | `@supabase/ssr` + middleware |
| Validation | Zod | 4.3.6 | Schemas en `@/lib/validations.ts` |
| Forms | react-hook-form | 7.72 | + `@hookform/resolvers` |
| Charts | Ninguno | - | `recharts` eliminado (no se usaba) |
| PDF | Ninguno | - | `jspdf`/`pdf-lib`/`react-pdf` eliminados (no se usaban) |
| Excel | xlsx (SheetJS) | 0.18.5 | Exportación de reportes |
| Testing | Vitest | 4.1.7 | 77 tests en 3 files |
| Lint | ESLint | 9.x | `eslint-config-next` + `unused-imports` |
| Format | Prettier | - | Config en `.prettierrc` |

## Comandos esenciales

```bash
npm run dev         # Dev server (http://localhost:3000) + React Scan for rerenders
npm run build       # Prisma generate + Next build
npm run lint        # ESLint (incluye detección de imports muertos)
npm run typecheck   # TypeScript check sin emitir
npm run test        # Vitest (77 tests)
npm run db:push     # Sync schema a DB (dev)
npm run db:studio   # Prisma Studio
npm run db:migrate  # Crear migración
npm run db:seed     # Ejecutar seed
npx prettier --write src/  # Formatear todo el código
```

## Estructura del proyecto

```
src/
├── app/                    # Next.js App Router
│   ├── admin/              # Panel de administración (usuarios, settings, cleanup)
│   ├── api/                # API routes públicas (storefront)
│   │   ├── ecommerce/products/  # GET catálogo online
│   │   ├── orders/              # POST crear pedido (storefront)
│   │   └── products/            # GET productos (legacy)
│   ├── dashboard/          # Dashboard principal con stats
│   ├── ecommerce/          # Admin catálogo online
│   │   └── products/[id]/  # Editor de producto ecommerce
│   ├── inventory/          # CRUD productos, movimientos de stock
│   ├── login/              # Login con Supabase
│   ├── orders/             # Gestión de pedidos online
│   ├── print/              # Impresión de facturas (ruta unificada)
│   ├── profile/            # Perfil de usuario (datos reales de sesión)
│   ├── register/           # Redirige a /login (solo admin crea usuarios)
│   ├── repairs/            # CRUD reparaciones con partes
│   ├── reports/            # Reportes (ventas, inventario, reparaciones, clientes)
│   └── sales/              # POS ventas con carrito y descuentos
├── components/
│   ├── forms/              # Formularios complejos (sale-form, product-form)
│   ├── layout/             # Sidebar, Header, DashboardLayout
│   └── ui/                 # shadcn/ui + Base UI components (24 components)
├── lib/
│   ├── labels.ts           # Helpers compartidos (getPaymentMethodLabel, etc.)
│   ├── validations.ts      # Zod schemas de todos los módulos
│   ├── finance.ts          # Cálculos financieros (subtotal, profit, margin)
│   ├── format.ts           # Formateo moneda/fechas (COP)
│   ├── stock-check.ts      # Utilidades de verificación de stock
│   ├── keyboard-shortcuts.ts # Atajos de teclado POS
│   ├── zod-error.ts        # Helper para mensajes de error Zod
│   ├── supabase.ts         # Cliente Supabase browser
│   ├── supabase-server.ts  # Cliente Supabase server (logout)
│   ├── prisma.ts           # Prisma Client singleton
│   └── utils.ts            # cn() utility (clsx + tailwind-merge)
├── modules/
│   ├── auth/               # getCurrentUser, requireAdmin, requireAuth, CRUD usuarios
│   ├── cleanup/            # Backup/restore/cleanup datos
│   ├── clients/            # CRUD clientes
│   ├── dashboard/          # Stats dashboard (ventas hoy, repairs ready, pedidos)
│   ├── ecommerce/          # Catálogo online CRUD + imágenes
│   ├── export/             # Exportación Excel
│   ├── inventory/          # Productos CRUD + movimientos stock
│   ├── orders/             # Pedidos CRUD + transiciones estado
│   ├── repairs/            # Reparaciones CRUD + partes
│   ├── reports/            # Reportes (ventas, inventario, reparaciones, clientes)
│   └── settings/           # Configuración del sistema
├── proxy.ts                # Middleware Supabase Auth (detectado por Next.js 16 build)
├── middleware.ts            # NO EXISTE — proxy.ts hace el rol
└── next.config.ts           # CORS headers + bodySizeLimit 10mb
```

## Convenciones de código críticas

- **Server Actions**: `src/modules/<modulo>/<modulo>.actions.ts`, con `'use server'`
- **API Routes**: `src/app/api/<ruta>/route.ts`, públicas, SIN auth (para storefront)
- **Auth en Server Actions**: Toda action administrativa DEBE llamar `requireAdmin()` al inicio
- **Validación**: Siempre Zod, schemas en `@/lib/validations.ts`
- **Errores Prisma**: Capturar P2002 (unique), P2025 (not found), P2003 (FK)
- **Stock**: Siempre en `prisma.$transaction()` las operaciones que modifican stock
- **Moneda**: `formatCurrency()` de `@/lib/format` (COP)
- **Cálculos**: Helpers de `@/lib/finance` (calcSubtotal, calcTotal, calcProfit, calcMargin, etc.)
- **CSS**: Tailwind only, NO CSS modules, NO inline styles
- **Páginas**: Server Component por defecto, `'use client'` solo cuando necesitas interactividad
- **Labels**: Usar helpers de `@/lib/labels` en lugar de definir funciones locales duplicadas
- **Navegación**: Usar `router.push()` (NO `window.location.href`)
- **Delete**: Usar shadcn `Dialog` (NO `window.confirm()`)
- **Error boundaries**: Siempre tener `error.tsx` con `ErrorFallback` en cada ruta

## Reglas de negocio (NO ROMPER)

1. **`Product.stock` es la única fuente de verdad** — Storefront NUNCA escribe stock.
2. **`unitPrice >= purchasePrice`** — No se puede vender por debajo del costo.
3. **Reparaciones**: `cost` (mano de obra) debe ser >= `partsCost`.
4. **Stock se descuenta en PENDING→CONFIRMED**, no al crear el pedido.
5. **Soft delete**: Productos y clientes tienen `deletedAt`. Siempre filtrar `deletedAt: null`.
6. **Enums en UPPERCASE** en schema (DB tiene datos legacy en lowercase).
7. **Transiciones de orden**: Solo `ALLOWED_TRANSITIONS`. Stock se restaura si estado previo era ≥ CONFIRMED.
8. **API endpoints son públicos** — Sin auth en `/api/*` (el storefront los consume).
9. **Middleware**: `proxy.ts` usa Supabase SSR con `getAll()`/`setAll()` + `applyCookies()`.

## Documentación compartida

Submodule en `docs/` → `github.com/anthra123x/tecnicell-docs`

**Leer primero:**
- `docs/docs/architecture/00-SYSTEM_OVERVIEW.md` — Visión general
- `docs/docs/architecture/01-SHARED_DATABASE.md` — Base de datos compartida
- `docs/docs/architecture/03-ORDER_FLOW.md` — Flujo de pedidos (crítico: stock side effects)

**Actualizar docs:**
```bash
cd docs && git add -A && git commit -m "mensaje" && git push origin main
cd .. && git add docs && git commit -m "docs: sync submodule" && git push
```

**Recibir cambios:**
```bash
git submodule update --remote docs && git add docs && git commit -m "docs: sync submodule" && git push
```

## Storefront integration

- Misma DB PostgreSQL en Supabase (compartida)
- Storefront lee productos via `GET /api/ecommerce/products` (API pública)
- Storefront escribe pedidos via `POST /api/orders` (API pública, con validación de precios)
- Storefront NUNCA escribe stock, productos ni datos de ecommerce
- `EcommerceProduct` y `ProductMedia` mapean a `product_ecommerce` y `product_media` en DB

## Tooling disponible

| Herramienta | Para qué | Cómo usarlo |
|------------|----------|-------------|
| ESLint + unused-imports | Detecta imports/vars sin uso | `npm run lint` |
| Prettier | Formateo consistente | `npx prettier --write src/` |
| React Scan | Detecta rerenders innecesarios | Se activa SOLO en dev automáticamente |
| Vitest | Tests unitarios (77 tests) | `npm test` |
| TypeScript strict | Type safety | `npm run typecheck` |
| Zod 4 | Validación runtime | Schemas en `@/lib/validations.ts` |

## Dependencias eliminadas (no se usaban)

| Paquete | Razón |
|---------|-------|
| `@supabase/auth-helpers-nextjs` | Deprecado, reemplazado por `@supabase/ssr` |
| `jspdf` / `jspdf-autotable` | No se usaban (0 imports) |
| `pdf-lib` | No se usaba (0 imports) |
| `react-pdf` | No se usaba (0 imports) |
| `recharts` | No se usaba (0 imports) — gráficos se renderizan server-side |
| `uuid` / `@types/uuid` | No se usaban (0 imports) |
| `shadcn` | Movido a devDependencies (es CLI, no runtime) |

## Decisiones de arquitectura (NO cambiar sin autorización)

- **Float → Decimal**: Diferido (23 campos, requiere migration). Riesgo alto.
- **`any` types**: Aceptados como deuda técnica. Refactor masivo sin valor inmediato.
- **Sin TanStack Table**: Las tablas actuales (shadcn Table simple) cubren bien CRUDs. Reports no justifica la complejidad.
- **Sin Framer Motion**: ERP con tablas/formularios no necesita animaciones complejas. View Transitions API de React 19 cubre lo necesario.
- **Sin Magic UI / Aceternity**: Efectos CSS sin valor real para un ERP. Añaden peso y dependencias.
- **Sin Sentry (aún)**: Sería valioso para producción, requiere setup de cuenta. Pendiente para próximo sprint.
- **Middleware**: `proxy.ts` es detectado automáticamente por Next.js 16 build como middleware. No necesita `middleware.ts`.

## Skills del agente (cargar cuando aplique)

| Skill | Cuándo usarlo |
|-------|--------------|
| `vercel-react-best-practices` | Optimización de componentes, data fetching, bundle |
| `vercel-composition-patterns` | Refactor de componentes con prop drilling, compound components |
| `tailwind-v4-shadcn` | Problemas de CSS, dark mode, theming, shadcn setup |
| `responsive-design` | Layouts responsive, container queries, mobile-first |
| `vercel-react-view-transitions` | Animaciones entre rutas, transiciones de estado |
| `tailwind-design-system` | Sistema de diseño, tokens, componentes reutilizables |
| `web-design-guidelines` | Auditoría de UI/UX, accesibilidad, diseño |

## Deuda técnica conocida

- [ ] Migrar Float→Decimal en 23 campos financieros
- [ ] Reducir uso de `any` types gradualmente
- [ ] Agregar Sentry para monitoreo en producción
- [ ] Agregar `loading.tsx` para rutas que aún no tienen
- [ ] Implementar perfil de administrador con cambio de contraseña real (Supabase Auth)
