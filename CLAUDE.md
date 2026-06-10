**Auth (`src/auth.ts`):** NextAuth v5 con provider `Credentials` y sesión JWT. El JWT callback extiende el token con `businessId` y `role` (OWNER / ADMIN / STAFF). El callback `authorized` delega la lógica a `getAuthorizedResponse` en `src/lib/auth-logic.ts`. No existe `middleware.ts` separado; la protección vive en `src/auth.ts`.

**Lógica de autorización (`src/lib/auth-logic.ts`):** Define `PUBLIC_PATHS` (`/`, `/login`, `/register`) y `PUBLIC_PREFIXES` (`/reserve`, `/api/public`, `/api/auth/verify-email`, `/api/auth/resend-verification`, `/api/auth/forgot-password`, `/api/auth/reset-password`). Redirige usuarios autenticados en `/login` hacia `/dashboard` (o `/admin` si rol es ADMIN). Las rutas `/admin/*` requieren rol ADMIN; el resto requiere estar autenticado si no es ruta pública.

**Base de datos (`src/lib/prisma.ts`):** Singleton de `PrismaClient` con el adaptador `PrismaPg`. En desarrollo se reutiliza la instancia en `global` para evitar conexiones múltiples por hot-reload.

**Tipos de sesión (`src/types/next-auth.d.ts`):** Augmentación de los módulos de NextAuth para exponer `id`, `businessId` y `role` en `session.user`.

**Utilidades (`src/lib/`):**
- `prisma.ts` — singleton PrismaClient (ver sección de base de datos)
- `auth-logic.ts` — lógica de autorización de rutas y redirects por rol
- `auth-schema.ts` — esquemas Zod para validar datos de autenticación (login, registro, reset, etc.)
- `plan-utils.ts` — funciones `checkServiceLimit`, `checkChairLimit`, `checkActiveUserLimit`, `checkInviteAllowed` que consultan los límites del plan antes de crear/activar recursos

**Componentes:**
- `src/components/ui/` — generados por shadcn/ui, **no modificar**
- `src/components/modules/` — componentes de la aplicación organizados por módulo:
  - `app-header.tsx` — header sticky (Server Component)
  - `mobile-nav.tsx` — menú hamburguesa para móvil (Sheet lateral, Client Component)
  - `nav-links.tsx` — links de navegación para desktop (Client Component)
  - `nav-manage-dropdown.tsx` — dropdown de gestión en desktop
  - `user-menu.tsx` — menú de usuario con cierre de sesión
  - `inactivity-guard.tsx` — cierre de sesión automático por inactividad
  - `staff-alerts.tsx` — alertas para staff sin puesto asignado
  - `admin/` — componentes del panel de admin (incluye `admin-mobile-nav.tsx`)
  - `auth/` — formularios de autenticación (`register-form.tsx`)
  - `booking/` — tabla de reservas y formulario de nueva reserva
  - `business/` — formulario y tarjeta de configuración del negocio
  - `calendar/` — vistas del calendario (day, week, month, chairs) y toolbar
  - `chair/` — gestión de puestos
  - `contact/` — formulario de contacto (`contact-form.tsx`)
  - `reserve/` — búsqueda de negocios y BookingWizard público
  - `schedule/` — formularios de horarios
  - `service/` — gestión de servicios
  - `statistics/` — gráficos de estadísticas (Recharts): KPI grid, tendencias, charts por silla/servicio/estado
  - `user/` — formulario de edición de perfil y cambio de contraseña

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
Siempre que realizamos cambios en componentes o creamos archivos nuevos, se debe ya sea ajustar o crear las test.


## Reglas

- **No modificar `src/components/ui/`** — son generados por shadcn/ui y se sobreescriben en actualizaciones. Las personalizaciones van en los componentes de cada módulo.
- **No instalar dependencias** sin aprobación explícita.
- **No usar `any` como tipo** — siempre tipar correctamente.
- **Siempre manejar errores** en las rutas API.
- **No modificar `/config`** sin preguntar primero.
- **Siempre filtrar por `businessId`** en cualquier consulta a la base de datos para mantener el aislamiento multi-tenant.
- **cuando vas a utilizar contante que se utilicen globalmente, crealas en `/contant`**
- **Todo lo manejamos con planes, no agregar nada como gratuito**