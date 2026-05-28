# Tecnicell - Sistema de Gestión ERP

Sistema completo de inventario, ventas POS, reparaciones y e-commerce para negocios de reparación de dispositivos y venta de accesorios.

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript 5.x (`strict: true`) |
| Base de Datos | PostgreSQL (Supabase + PgBouncer) |
| ORM | Prisma 5 |
| CSS | Tailwind CSS 4 + shadcn/ui + Base UI |
| Auth | Supabase Auth (SSR) |
| Validación | Zod 4 + react-hook-form |
| Tests | Vitest (121 tests) |
| Error Tracking | Sentry |
| Excel | SheetJS (xlsx) |

## Módulos

- **Inventario**: CRUD, control de stock, alertas, movimientos
- **Ventas POS**: Carrito, descuentos, múltiples métodos de pago, editar/eliminar con restauración de stock
- **Reparaciones**: Órdenes de trabajo, flujo de estados, partes y costos
- **Clientes**: Gestión con historial de compras y reparaciones
- **E-commerce**: Catálogo online, precios, imágenes, visibilidad
- **Pedidos Online**: Gestión de pedidos del storefront con transiciones de estado
- **Dashboard**: Métricas en tiempo real (ventas hoy, reparaciones listas, pedidos)
- **Reportes**: Exportación a Excel con filtros avanzados
- **Configuración**: Settings del sistema, usuarios, backup/cleanup

## Requisitos Previos

- Node.js 18+
- Cuenta en [Supabase](https://supabase.com)
- Cuenta en [Vercel](https://vercel.com) (para deploy)
- Cuenta en [Sentry](https://sentry.io) (para error tracking)

## Instalación

```bash
git clone <repo-url>
cd inventario-tecnicell
npm install
```

### Configurar Supabase

Crea un proyecto en Supabase y configura `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:pass@db.tu-proyecto.supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:pass@db.tu-proyecto.supabase.co:5432/postgres
SENTRY_DSN=https://key@oXXXX.ingest.us.sentry.io/XXXX
```

### Sincronizar Base de Datos

```bash
npm run db:push
```

### Ejecutar

```bash
npm run dev
```

## Scripts

```bash
npm run dev          # Desarrollo (http://localhost:3000)
npm run build        # Build producción
npm run lint         # ESLint (detecta imports muertos)
npm run typecheck    # TypeScript check
npm run test         # Vitest (121 tests)
npm run db:push      # Sync schema a DB
npm run db:migrate   # Crear migración
npm run db:studio    # Prisma Studio
npm run db:seed      # Ejecutar seed
npx prettier --write src/  # Formatear código
```

## Deploy en Vercel

1. Conecta el repositorio a Vercel
2. Configura las variables de entorno en Vercel (todas las de `.env.local`)
3. Vercel hace deploy automático con cada push a `main`

## Estructura

```
src/
├── app/                 # App Router
│   ├── admin/           # Panel admin (usuarios, settings)
│   ├── api/             # API públicas (storefront)
│   ├── dashboard/       # Dashboard con stats
│   ├── ecommerce/       # Catálogo online admin
│   ├── inventory/       # CRUD productos
│   ├── login/           # Login Supabase
│   ├── orders/          # Pedidos online
│   ├── print/           # Impresión facturas
│   ├── profile/         # Perfil usuario
│   ├── register/        # Redirige a login
│   ├── repairs/         # Reparaciones
│   ├── reports/         # Reportes Excel
│   └── sales/           # POS ventas
├── components/
│   ├── forms/           # Formularios complejos
│   ├── layout/          # Sidebar, Header
│   └── ui/              # shadcn/ui + Base UI
├── lib/                 # Utilidades compartidas
├── modules/             # Lógica de negocio (server actions)
│   ├── auth/            # Auth + roles
│   ├── cleanup/         # Backup/restore
│   ├── clients/         # CRUD clientes
│   ├── dashboard/       # Stats
│   ├── ecommerce/       # Catálogo online
│   ├── export/          # Excel
│   ├── inventory/       # Productos + stock
│   ├── orders/          # Pedidos
│   ├── repairs/         # Reparaciones
│   ├── reports/         # Reportes
│   ├── sales/           # Ventas
│   └── settings/        # Configuración
├── proxy.ts             # Middleware Supabase Auth
└── next.config.ts       # Config Next.js
```

## Licencia

Propietario. Todos los derechos reservados.
