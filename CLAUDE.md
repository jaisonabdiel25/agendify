# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
pnpm dev          # servidor de desarrollo
pnpm build        # build de producción
pnpm lint         # ESLint
pnpm start        # servidor de producción (requiere build previo)

# Tests
pnpm test             # jest en modo watch
pnpm test:run         # jest una sola vez (CI)
pnpm test:coverage    # jest con reporte de cobertura (umbral global: 90%)

# Prisma
pnpm prisma generate          # regenerar cliente después de cambiar schema
pnpm prisma migrate dev       # crear y aplicar migración en desarrollo
pnpm prisma migrate deploy    # aplicar migraciones en producción
pnpm prisma studio            # UI visual de la base de datos
```

## Arquitectura

**Agendify** es una plataforma SaaS multi-tenant para gestión de negocios (reservas, equipo, clientes). El modelo central es `Business` — todo dato (usuarios, sillas, servicios, clientes, reservas) lleva `businessId` y se filtra siempre por él.

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Prisma 7 + PostgreSQL (`PrismaPg` adapter) · NextAuth v5 beta · Tailwind CSS v4 · shadcn/ui · Zod · react-hook-form · Recharts · sonner

**Grupos de rutas:**
- `src/app/` — landing pública (`/`) y wizard de reserva pública (`/reserve`)
- `src/app/(auth)/` — páginas públicas de acceso (`/login`, `/register`)
- `src/app/(app)/` — páginas autenticadas:
  - `/dashboard` — calendario de reservas
  - `/booking` — tabla de reservas
  - `/schedule` — cronograma de horarios por puesto
  - `/statistics` — estadísticas del negocio (OWNER / ADMIN)
  - `/chair`, `/chair/new`, `/chair/[id]` — gestión de puestos (OWNER / ADMIN)
  - `/service`, `/service/new`, `/service/[id]/edit` — gestión de servicios (OWNER / ADMIN)
  - `/business` — configuración del negocio (OWNER / ADMIN)
  - `/user` — perfil de usuario
- `src/app/admin/` — panel de super-admin (`/admin`)
- `src/app/api/` — rutas de API REST:
  - `auth/[...nextauth]` — handler de NextAuth
  - `auth/register` — registro de usuarios con código de invitación
  - `bookings`, `bookings/[id]` — CRUD de reservas
  - `chairs`, `chairs/[id]` — CRUD de puestos
  - `services`, `services/[id]`, `services/[id]/chairs` — CRUD de servicios y asignación a puestos
  - `schedule` — horarios por puesto
  - `business`, `business/invitation` — configuración del negocio e invitaciones
  - `admin/businesses`, `admin/businesses/[id]`, `admin/invitations` — endpoints de super-admin
  - `public/businesses`, `public/chairs`, `public/services`, `public/availability`, `public/bookings` — endpoints públicos para el wizard de reserva

**Auth (`src/auth.ts`):** NextAuth v5 con provider `Credentials` y sesión JWT. El JWT callback extiende el token con `businessId` y `role` (OWNER / ADMIN / STAFF). El callback `authorized` actúa como middleware: protege todas las rutas salvo `/`, `/login`, `/register`, `/reserve` y redirige usuarios autenticados que intentan acceder a `/login` hacia `/dashboard`. No existe `middleware.ts` separado; la protección vive en `src/auth.ts`.

**Base de datos (`src/lib/prisma.ts`):** Singleton de `PrismaClient` con el adaptador `PrismaPg`. En desarrollo se reutiliza la instancia en `global` para evitar conexiones múltiples por hot-reload.

**Tipos de sesión (`src/types/next-auth.d.ts`):** Augmentación de los módulos de NextAuth para exponer `id`, `businessId` y `role` en `session.user`.

**Componentes:**
- `src/components/ui/` — generados por shadcn/ui, **no modificar**
- `src/components/modules/` — componentes de la aplicación organizados por módulo:
  - `app-header.tsx` — header sticky (Server Component)
  - `mobile-nav.tsx` — menú hamburguesa para móvil (Sheet lateral, Client Component)
  - `nav-links.tsx` — links de navegación para desktop (Client Component)
  - `nav-manage-dropdown.tsx` — dropdown de gestión en desktop
  - `user-menu.tsx` — menú de usuario con cierre de sesión
  - `inactivity-guard.tsx` — cierre de sesión automático por inactividad
  - `admin/` — componentes del panel de admin
  - `booking/` — tabla de reservas y BookingWizard público
  - `calendar/` — vistas del calendario (day, week, month, chairs)
  - `chair/` — gestión de puestos
  - `schedule/` — formularios de horarios
  - `service/` — gestión de servicios
  - `statistics/` — gráficos de estadísticas (Recharts)

**Hooks (`src/hooks/`):**
- `use-calendar.ts` — lógica del calendario: fetch de reservas, filtros, navegación, posicionamiento de eventos
- `use-inactivity-logout.ts` — detecta inactividad del usuario y dispara cierre de sesión

**Tipografía:** Fraunces (variable `--font-fraunces`) se usa como fuente de display vía la clase `font-display` para títulos itálicos. Geist Sans y Geist Mono son las fuentes base.

## Diseño

- Todos los diseños deben ser responsive para cualquier pantalla.
- En mobile (< 640px) la navegación usa el menú hamburguesa (`MobileNav`); en desktop se muestra la barra horizontal (`NavLinks`).

## Tests

Los tests viven en `src/__tests__/` con dos subcarpetas:
- `api/` — tests de rutas API con mocks de Prisma y NextAuth
- `components/` — tests de componentes con jsdom, React Testing Library y mocks de next/navigation, sonner, recharts

El umbral de cobertura global es **90%** en branches, functions, lines y statements (configurado en `jest.config.mjs`).

## Reglas

- **No modificar `src/components/ui/`** — son generados por shadcn/ui y se sobreescriben en actualizaciones. Las personalizaciones van en los componentes de cada módulo.
- **No instalar dependencias** sin aprobación explícita.
- **No usar `any` como tipo** — siempre tipar correctamente.
- **Siempre manejar errores** en las rutas API.
- **No modificar `/config`** sin preguntar primero.
- **Siempre filtrar por `businessId`** en cualquier consulta a la base de datos para mantener el aislamiento multi-tenant.
- **cuando vas a utilizar contante que se utilicen globalmente, crealas en `/contant`** 