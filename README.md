# Gestión - Sistema de Inventario

Sistema completo de inventario, ventas POS y reparaciones.

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Lenguaje | TypeScript 5.x |
| Base de Datos | PostgreSQL (Supabase) |
| ORM | Prisma 5 |
| CSS | Tailwind CSS 4 + shadcn/ui |
| Auth | Supabase Auth (SSR) |
| Validación | Zod 4 |
| Tests | Vitest (114 tests) |

## Módulos

- **Inventario**: CRUD, control de stock, alertas, movimientos
- **Ventas POS**: Carrito, descuentos, múltiples métodos de pago
- **Reparaciones**: Órdenes de trabajo, flujo de estados, partes y costos
- **Clientes**: Gestión con historial de compras y reparaciones
- **Dashboard**: Métricas en tiempo real
- **Reportes**: Exportación a Excel

## Instalación

```bash
git clone https://github.com/anthra123x/gestion-inventario.git
cd gestion-inventario
npm install
```

Configurar `.env.local` con datos de Supabase y ejecutar:

```bash
npm run db:push
npm run dev
```
