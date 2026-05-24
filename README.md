# Agendify

Plataforma SaaS multi-tenant para gestión de negocios de servicios (barberías, salones, etc.). Permite administrar reservas, equipo, horarios, clientes y estadísticas desde una sola aplicación.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript
- **Base de datos:** PostgreSQL con Prisma 7 (`PrismaPg` adapter)
- **Auth:** NextAuth v5 beta — sesión JWT con roles (OWNER / ADMIN / STAFF)
- **UI:** Tailwind CSS v4 + shadcn/ui + Lucide React + Recharts
- **Formularios:** react-hook-form + Zod
- **Notificaciones:** Sonner
- **Tests:** Jest + React Testing Library

## Requisitos

- Node.js 20+
- pnpm
- PostgreSQL

## Instalación

```bash
pnpm install
```

Crea un archivo `.env` en la raíz con las siguientes variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/agendify"
AUTH_SECRET="your-secret-key"
```

Aplica las migraciones y genera el cliente de Prisma:

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

## Comandos

```bash
pnpm dev              # servidor de desarrollo en http://localhost:3000
pnpm build            # build de producción
pnpm start            # servidor de producción (requiere build previo)
pnpm lint             # ESLint

# Tests
pnpm test             # jest en modo watch
pnpm test:run         # jest una sola vez
pnpm test:coverage    # jest con reporte de cobertura (umbral: 90%)

# Prisma
pnpm prisma generate          # regenerar cliente después de cambiar schema
pnpm prisma migrate dev       # crear y aplicar migración en desarrollo
pnpm prisma migrate deploy    # aplicar migraciones en producción
pnpm prisma studio            # UI visual de la base de datos
```

## Módulos

| Ruta | Descripción | Roles |
|---|---|---|
| `/` | Landing pública | Público |
| `/reserve` | Wizard de reserva pública | Público |
| `/login` / `/register` | Acceso | Público |
| `/dashboard` | Calendario de reservas | Todos |
| `/booking` | Tabla de reservas | Todos |
| `/schedule` | Cronograma de horarios | Todos |
| `/statistics` | Estadísticas del negocio | OWNER / ADMIN |
| `/chair` | Gestión de puestos | OWNER / ADMIN |
| `/service` | Gestión de servicios | OWNER / ADMIN |
| `/business` | Configuración del negocio | OWNER / ADMIN |
| `/user` | Perfil de usuario | Todos |
| `/admin` | Panel de super-admin | Super-admin |

## Planes

Cada negocio tiene un plan asociado que determina sus límites de uso.

| Recurso | Estándar | Pro |
|---|---|---|
| Servicios activos | 1 | 2 |
| Puestos activos | 1 | 3 |
| Usuarios (incluye OWNER) | 1 | 3 |
| Invitaciones | No permitido | Hasta completar 3 usuarios |
| Estadísticas | Solo "Estado de reservas" | Todos los gráficos |

- Los límites se definen en `src/constant.ts` (`PLAN_LIMITS`).
- El admin asigna el plan al crear el negocio o desde `/admin/plans`.
- Los negocios existentes al crear el sistema reciben el plan **Pro**.

## Modelo de datos

El modelo central es `Business` — todo registro (usuarios, puestos, servicios, clientes, reservas) lleva `businessId` y se filtra siempre por él para garantizar el aislamiento multi-tenant.

```
Plan (STANDARD | PRO)
  └── Business
        ├── User (roles: OWNER, ADMIN, STAFF)
        ├── Chair (puesto de trabajo)
        │     ├── ChairSchedule (horarios por día)
        │     └── ChairService (servicios que ofrece)
        ├── Service (servicio con duración y precio)
        ├── Customer (cliente del negocio)
        ├── Booking (reserva con estado: PENDING, CONFIRMED, COMPLETED, CANCELLED, NO_SHOW)
        └── Invitation (código de invitación para registro)
```
