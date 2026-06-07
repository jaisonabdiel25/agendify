"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, LayoutDashboard, CreditCard, UserCircle } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

const links = [
  { href: "/admin", icon: LayoutDashboard, label: "Panel Admin", exact: true },
  { href: "/admin/plans", icon: CreditCard, label: "Planes", exact: false },
  { href: "/admin/profile", icon: UserCircle, label: "Mi perfil", exact: false },
]

export function AdminMobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function linkClass(href: string, exact: boolean) {
    const isActive = exact ? pathname === href : pathname.startsWith(href)
    return isActive
      ? "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium bg-accent text-accent-foreground"
      : "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="sm:hidden shrink-0">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <div className="px-4 py-4 border-b border-border">
          <SheetTitle className="font-bold text-base tracking-tight">Agendify Admin</SheetTitle>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {links.map(({ href, icon: Icon, label, exact }) => (
            <Link key={href} href={href} className={linkClass(href, exact)} onClick={() => setOpen(false)}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
