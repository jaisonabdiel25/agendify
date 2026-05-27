import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PlansTable } from "@/components/modules/admin/plans-table"
import { PlanFormDialog } from "@/components/modules/admin/plan-form-dialog"
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/admin" className="font-bold text-base tracking-tight shrink-0 hover:opacity-80 transition-opacity">
            Agendify
          </Link>
          <span className="text-muted-foreground/40 shrink-0">·</span>
          <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Panel Admin
          </Link>
          <span className="text-muted-foreground/40 shrink-0">·</span>
          <span className="text-sm truncate">Planes</span>
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
              <div key={plan.id} className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{plan.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{plan.type}</p>
                  </div>
                  <PlanFormDialog plan={plan} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/40 px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">Servicios</p>
                    <p className="text-sm font-medium">{plan.maxServices}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">Puestos</p>
                    <p className="text-sm font-medium">{plan.maxChairs}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-2 py-1.5">
                    <p className="text-xs text-muted-foreground">Usuarios</p>
                    <p className="text-sm font-medium">{plan.maxUsers}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Precio:{" "}
                    <span className="font-medium text-foreground">
                      {plan.price !== null ? `$${Number(plan.price).toFixed(2)}` : "—"}
                    </span>
                  </span>
                  <span>
                    Descuento:{" "}
                    <span className="font-medium text-foreground">
                      {plan.discount !== null ? `${plan.discount}%` : "—"}
                    </span>
                  </span>
                  <span>
                    Invitaciones:{" "}
                    <span className={`font-medium ${plan.canInvite ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                      {plan.canInvite ? "Sí" : "No"}
                    </span>
                  </span>
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
