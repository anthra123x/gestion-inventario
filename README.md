# Tecnicell - Sistema de Gestión

Sistema completo de inventario y gestión para negocios de reparación de dispositivos, venta de accesorios y repuestos.

## Características

### Core Modules
- **Autenticación y Roles**: Sistema seguro con roles Admin/Empleado
- **Inventario**: CRUD completo, control de stock, alertas de bajo stock
- **Ventas**: Registro automático, múltiples métodos de pago, descuento de inventario
- **Reparaciones**: Sistema de órdenes de trabajo con flujo de estados completo
- **Clientes**: Gestión completa con historial de compras y reparaciones
- **Dashboard**: Métricas en tiempo real con gráficas
- **Reportes**: Exportación a PDF y Excel con filtros avanzados

### Features Avanzadas
- Búsqueda global instantánea
- Notificaciones toast
- UI moderna y responsive
- Tipado estricto con TypeScript
- Validaciones con Zod

## Stack Tecnológico

- **Frontend**: Next.js 16 (App Router) + TypeScript + TailwindCSS + Shadcn UI
- **Backend**: Server Actions
- **Base de Datos**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Charts**: Recharts
- **Deploy**: Vercel

## Requisitos Previos

1. Node.js 18+
2. Cuenta en Supabase
3. Cuenta en Vercel (para deploy)

## Instalación y Configuración

### 1. Clonar el proyecto

```bash
git clone <repository-url>
cd sistema-inventario-tecnicell
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Ve a Settings > API y copia las credenciales
3. Crea el archivo `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu-anon-key-aqui...
SUPABASE_SERVICE_ROLE_KEY=eyJ...tu-service-role-key-aqui...

# Database URL (Connection string directo)
DATABASE_URL=postgresql://postgres:tu-contraseña@db.tu-project-ref.supabase.co:5432/postgres

# NextAuth
NEXTAUTH_SECRET=tu-nextauth-secret-generado-aqui
NEXTAUTH_URL=http://localhost:3000
```

### 4. Configurar la Base de Datos

```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear las tablas
npx prisma db push

# (Opcional) Ver la base de datos
npx prisma studio
```

### 5. Ejecutar la aplicación

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso del Sistema

### Primeros Pasos

1. **Crear cuenta de usuario**: Ve a `/register`
2. **Iniciar sesión**: Usa tus credenciales en `/login`
3. **Acceder al dashboard**: Serás redirigido automáticamente

### Módulos Principales

#### Inventario (`/inventory`)
- Agregar productos con stock inicial
- Configurar categorías y precios
- Monitorear niveles de stock
- Registrar movimientos de entrada/salida

#### Ventas (`/sales`)
- Registrar ventas con múltiples productos
- Seleccionar método de pago
- El inventario se descuenta automáticamente
- Ver historial completo

#### Reparaciones (`/repairs`)
- Crear órdenes de trabajo
- Asignar repuestos (descuenta inventario)
- Seguir flujo: Recibido -> En Progreso -> Listo -> Entregado
- Agregar notas internas y para clientes

#### Clientes (`/clients`)
- Gestión completa de clientes
- Historial de compras y reparaciones
- Estadísticas por cliente

#### Reportes (`/reports`)
- Generar reportes por fecha y filtros
- Exportar a PDF y Excel
- Análisis de ventas, inventario, reparaciones y clientes

## Deploy en Vercel

### 1. Preparar el proyecto

```bash
# Construir para producción
npm run build

# Verificar que todo funciona
npm start
```

### 2. Deploy automático

1. Conecta tu repositorio a [Vercel](https://vercel.com)
2. Configura las variables de entorno en el dashboard de Vercel (Settings > Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL` (Connection string directo de Supabase)
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (https://tu-dominio.vercel.app)

3. Haz deploy automático con cada push a main

### 3. Post-deploy

1. Ejecuta migraciones en producción:
   ```bash
   npx prisma db push
   ```

2. Crea el primer usuario administrador

## Estructura del Proyecto

```
src/
|-- app/                 # App Router (Next.js 14)
|   |-- (auth)/         # Rutas de autenticación
|   |-- dashboard/      # Dashboard principal
|   |-- inventory/      # Módulo de inventario
|   |-- sales/          # Módulo de ventas
|   |-- repairs/        # Módulo de reparaciones
|   |-- clients/        # Módulo de clientes
|   |-- reports/        # Módulo de reportes
|   |-- layout.tsx      # Layout principal
|   `-- page.tsx        # Página de inicio
|-- components/         # Componentes reutilizables
|   |-- ui/            # Componentes Shadcn UI
|   |-- forms/         # Formularios
|   |-- layout/        # Layout components
|   `-- charts/        # Componentes de gráficas
|-- modules/           # Lógica de negocio
|   |-- auth/          # Autenticación
|   |-- inventory/     # Inventario
|   |-- sales/         # Ventas
|   |-- repairs/       # Reparaciones
|   |-- clients/       # Clientes
|   |-- reports/       # Reportes
|   `-- dashboard/     # Dashboard
|-- lib/               # Utilidades
|   |-- prisma.ts      # Cliente Prisma
|   |-- supabase.ts    # Cliente Supabase
|   |-- types.ts       # Tipos TypeScript
|   |-- validations.ts # Validaciones Zod
|   `-- utils.ts       # Utilidades varias
|-- hooks/             # Hooks personalizados
|   `-- use-global-search.ts
`-- services/          # Servicios externos
```

## Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Construcción
npm run build
npm start

# Base de datos
npm run db:push      # Crear/actualizar tablas
npm run db:migrate   # Ejecutar migraciones
npm run db:studio    # Ver base de datos

# Lint
npm run lint
```

## Contribución

1. Fork el proyecto
2. Crea una feature branch (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## Soporte

Para soporte técnico o preguntas:
- Revisa la documentación
- Abre un issue en el repositorio
- Contacta al equipo de desarrollo

## Licencia

Este proyecto es propiedad de Tecnicell. Todos los derechos reservados.
