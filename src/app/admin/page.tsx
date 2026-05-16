import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ThemeToggle } from "@/components/theme-toggle"
import { CreateBusinessForm } from "@/components/modules/admin/create-business-form"
import { CreateInvitationForm } from "@/components/modules/admin/create-invitation-form"

export const metadata: Metadata = {
  title: "Admin — Agendify",
}

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const [businesses, invitations] = await Promise.all([
    prisma.business.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, isActive: true, createdAt: true },
    }),
    prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        code: true,
        usedAt: true,
        createdAt: true,
        business: { select: { name: true } },
      },
    }),
  ])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-bold text-base tracking-tight">
              Agendify
            </Link>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm text-muted-foreground">Panel Admin</span>
          </div>
          <div className="flex items-center gap-3">
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

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg p-6">
            <h2 className="font-display italic font-light text-2xl leading-tight mb-1">
              Nuevo negocio
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Registra un negocio en la plataforma
            </p>
            <CreateBusinessForm />
          </div>

          <div className="border border-border rounded-lg p-6">
            <h2 className="font-display italic font-light text-2xl leading-tight mb-1">
              Nueva invitación
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Genera un código de acceso para el dueño del negocio
            </p>
            <CreateInvitationForm businesses={businesses} />
          </div>
        </div>

        <section>
          <h2 className="font-display italic font-light text-2xl mb-4">Negocios</h2>
          {businesses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay negocios registrados.</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {businesses.map((b) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 font-medium">{b.name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {b.slug}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {b.isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(b.createdAt).toLocaleDateString("es-PA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section>
          <h2 className="font-display italic font-light text-2xl mb-4">Invitaciones</h2>
          {invitations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay invitaciones generadas.</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Negocio</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Creado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invitations.map((inv) => (
                    <tr key={inv.id}>
                      <td className="px-4 py-3 font-medium">{inv.business.name}</td>
                      <td className="px-4 py-3 font-mono tracking-widest text-xs">
                        {inv.code}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            inv.usedAt
                              ? "bg-muted text-muted-foreground"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {inv.usedAt ? "Usada" : "Disponible"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(inv.createdAt).toLocaleDateString("es-PA")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
