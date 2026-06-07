import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserProfileCard } from "@/components/modules/user/edit-user-form"
import { ChangePasswordForm } from "@/components/modules/user/change-password-form"
import { AdminMobileNav } from "@/components/modules/admin/admin-mobile-nav"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "Mi perfil — Admin",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export default async function AdminProfilePage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, description: true },
  })

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
              <span className="hidden sm:inline text-sm truncate" aria-current="page">Mi perfil</span>
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

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 rounded-full bg-foreground/10 flex items-center justify-center text-lg font-medium text-foreground shrink-0 select-none">
                {getInitials(user.name)}
              </div>
              <div>
                <h1 className="font-display font-light text-3xl leading-tight">{user.name}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Administrador</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card">
                <div className="px-6 py-4 border-b border-border">
                  <h2 className="font-medium text-sm">Información de cuenta</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Estos datos no son editables.</p>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label>Correo electrónico</Label>
                    <Input value={user.email} disabled readOnly className="bg-muted/40" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Rol</Label>
                    <Input value="Administrador" disabled readOnly className="bg-muted/40" />
                  </div>
                </div>
              </div>

              <UserProfileCard user={{ id: user.id, name: user.name, description: user.description }} />
              <ChangePasswordForm />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
