# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
pnpm dev          # servidor de desarrollo
pnpm build        # build de producción
pnpm lint         # ESLint
pnpm start        # servidor de producción (requiere build previo)

# Prisma
pnpm prisma generate          # regenerar cliente después de cambiar schema
pnpm prisma migrate dev       # crear y aplicar migración en desarrollo
pnpm prisma migrate deploy    # aplicar migraciones en producción
pnpm prisma studio            # UI visual de la base de datos
```

## Arquitectura

**Agendify** es una plataforma SaaS multi-tenant para gestión de negocios (reservas, equipo, clientes). El modelo central es `Business` — todo dato (usuarios, sillas, servicios, clientes, reservas) lleva `businessId` y se filtra siempre por él.

**Stack:** Next.js 16 App Router · React 19 · TypeScript · Prisma 7 + PostgreSQL (`PrismaPg` adapter) · NextAuth v5 beta · Tailwind CSS v4 · shadcn/ui · Zod · react-hook-form · sonner

**Grupos de rutas:**
- `src/app/` — landing pública (`/`)
- `src/app/(auth)/` — páginas públicas de acceso (`/login`, `/register`)
- `src/app/(app)/` — páginas autenticadas (dashboard y módulos)
- `src/app/api/auth/[...nextauth]/` — handler de NextAuth

**Auth (`src/auth.ts`):** NextAuth v5 con provider `Credentials` y sesión JWT. El JWT callback extiende el token con `businessId` y `role` (OWNER / ADMIN / STAFF). El callback `authorized` actúa como middleware: protege todas las rutas salvo `/`, `/login`, `/register` y redirige usuarios autenticados que intentan acceder a `/login` hacia `/dashboard`. No existe `middleware.ts` separado; la protección vive en `src/auth.ts`.

**Base de datos (`src/lib/prisma.ts`):** Singleton de `PrismaClient` con el adaptador `PrismaPg`. En desarrollo se reutiliza la instancia en `global` para evitar conexiones múltiples por hot-reload.

**Tipos de sesión (`src/types/next-auth.d.ts`):** Augmentación de los módulos de NextAuth para exponer `id`, `businessId` y `role` en `session.user`.

**Componentes:**
- `src/components/ui/` — generados por shadcn/ui, **no modificar**
- `src/components/` — componentes de la aplicación (landing, auth, theme, admin)
- `src/hooks/` — aqui se crean custom hooks para separar la logica de negocio del lado del cliente

**Tipografía:** Fraunces (variable `--font-fraunces`) se usa como fuente de display vía la clase `font-display` para títulos itálicos. Geist Sans y Geist Mono son las fuentes base.

## Diseño

- Todos los diseños deben ser responsive para cualquier pantalla.

## Reglas

- **No modificar `src/components/ui/`** — son generados por shadcn/ui y se sobreescriben en actualizaciones. Las personalizaciones van en los componentes de cada módulo.
- **No instalar dependencias** sin aprobación explícita.
- **No usar `any` como tipo** — siempre tipar correctamente.
- **Siempre manejar errores** en las rutas API.
- **No modificar `/config`** sin preguntar primero.
- **Siempre filtrar por `businessId`** en cualquier consulta a la base de datos para mantener el aislamiento multi-tenant.
-
