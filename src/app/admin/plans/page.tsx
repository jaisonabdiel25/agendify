import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Check, X } from "lucide-react"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ThemeToggle } from "@/components/theme-toggle"
import { PlansTable } from "@/components/modules/admin/plans-table"
import { PlanFormDialog } from "@/components/modules/admin/plan-form-dialog"
import { AdminMobileNav } from "@/components/modules/admin/admin-mobile-nav"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Planes — Admin",
}

export default async function AdminPlansPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const [businesses, plans] = await Promise.all([
    prisma.business.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        plan: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.plan.findMany({
      select: {
        id: true,
        type: true,
        name: true,
        maxServices: true,
        maxChairs: true,
        maxUsers: true,
        canInvite: true,
        statisticsCharts: true,
        price: true,
        discount: true,
      },
      orderBy: { createdAt: "asc" },
    }),
  ])

  const serializedPlans = plans.map((p) => ({
    ...p,
    price: p.price?.toString() ?? null,
  }))

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <AdminMobileNav />
            <nav aria-label="Navegación de admin" className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Link href="/" className="font-bold text-base tracking-tight shrink-0 hover:opacity-80 transition-opacity">
                Agendify
              </Link>
              <span className="hidden sm:inline text-muted-foreground/40 shrink-0" aria-hidden="true">·</span>
              <Link href="/admin" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
                Panel Admin
              </Link>
              <span className="hidden sm:inline text-muted-foreground/40 shrink-0" aria-hidden="true">·</span>
              <span className="hidden sm:inline text-sm truncate" aria-current="page">Planes</span>
              <span className="hidden sm:inline text-muted-foreground/40 shrink-0" aria-hidden="true">·</span>
              <Link href="/admin/profile" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
                Mi perfil
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <button
                type="submit"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cerrar sesión
              </button>
            </form>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10">
        {/* ── Configuración de planes ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display font-light text-2xl sm:text-3xl">Configuración de planes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Crea o edita los planes disponibles en la plataforma.
              </p>
            </div>
            <PlanFormDialog trigger={<Button size="sm">Crear plan</Button>} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {serializedPlans.map((plan) => (
              <div key={plan.id} className="border border-border rounded-xl p-5 space-y-4 bg-card">
                {/* Header de la card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-base">{plan.name}</p>
                    <span className="inline-block font-mono text-[0.65rem] tracking-widest uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded">
                      {plan.type}
                    </span>
                  </div>
                  <PlanFormDialog plan={plan} />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                    <p className="text-[0.7rem] text-muted-foreground mb-0.5">Servicios</p>
                    <p className="text-lg font-semibold tabular-nums">{plan.maxServices}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                    <p className="text-[0.7rem] text-muted-foreground mb-0.5">Puestos</p>
                    <p className="text-lg font-semibold tabular-nums">{plan.maxChairs}</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-3 py-2.5 text-center">
                    <p className="text-[0.7rem] text-muted-foreground mb-0.5">Usuarios</p>
                    <p className="text-lg font-semibold tabular-nums">{plan.maxUsers}</p>
                  </div>
                </div>

                {/* Precio, descuento e invitaciones */}
                <div className="border-t border-border pt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Precio</p>
                    <p className="text-sm font-medium tabular-nums">
                      {plan.price !== null ? `$${Number(plan.price).toFixed(2)}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Descuento</p>
                    <p className="text-sm font-medium tabular-nums">
                      {plan.discount !== null ? `${plan.discount}%` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Invitaciones</p>
                    <div className="flex justify-center">
                      {plan.canInvite ? (
                        <Check
                          className="h-4 w-4 text-emerald-500"
                          aria-label="Permite invitaciones"
                        />
                      ) : (
                        <X
                          className="h-4 w-4 text-muted-foreground"
                          aria-label="No permite invitaciones"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Asignación de planes ── */}
        <section className="space-y-4">
          <div>
            <h2 className="font-display font-light text-xl sm:text-2xl">Asignación de planes</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Asigna o cambia el plan de cada negocio en la plataforma.
            </p>
          </div>

          <PlansTable businesses={businesses} plans={serializedPlans} />
        </section>
      </main>
    </div>
  )
}
