import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PlansTable } from "@/components/modules/admin/plans-table"

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
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
  ])

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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <div>
          <h1 className="font-display font-light text-2xl sm:text-3xl">Gestión de planes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Asigna o cambia el plan de cada negocio en la plataforma.
          </p>
        </div>

        <PlansTable businesses={businesses} plans={plans} />
      </main>
    </div>
  )
}
