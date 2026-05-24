import Link from "next/link"
import { auth, signOut } from "@/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavLinks } from "./nav-links"
import { UserMenu } from "./user-menu"
import { MobileNav } from "./mobile-nav"

export async function AppHeader() {
  const session = await auth()
  const canManage =
    session?.user?.role === "OWNER" || session?.user?.role === "ADMIN"

  async function handleSignOut() {
    "use server"
    await signOut({ redirectTo: "/login" })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border px-4 sm:px-6 py-3 sm:py-4 shrink-0 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex items-center justify-between gap-3 sm:gap-6">
        <div className="flex items-center gap-2">
          <MobileNav canManage={canManage} />
          <Link href="/dashboard" className="font-bold text-base tracking-tight shrink-0 hover:opacity-80 transition-opacity">
            Agendify
          </Link>
        </div>

        <NavLinks canManage={canManage} />

        <div className="flex items-center gap-3">
          {session?.user?.name && (
            <UserMenu userName={session.user.name} signOutAction={handleSignOut} />
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
