"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, CalendarDays, BookOpen, Clock4, BarChart2, Armchair, Scissors, Building2 } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

interface MobileNavProps {
  canManage: boolean
}

export function MobileNav({ canManage }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  function linkClass(href: string) {
    const isActive = pathname === href || pathname.startsWith(href + "/")
    return isActive
      ? "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium bg-accent text-accent-foreground"
      : "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
  }

  const mainLinks = [
    { href: "/dashboard", icon: CalendarDays, label: "Calendario" },
    { href: "/booking", icon: BookOpen, label: "Reservas" },
    { href: "/schedule", icon: Clock4, label: "Cronograma" },
    ...(canManage ? [{ href: "/statistics", icon: BarChart2, label: "Estadísticas" }] : []),
  ]

  const manageLinks = [
    { href: "/chair", icon: Armchair, label: "Puestos" },
    { href: "/service", icon: Scissors, label: "Servicios" },
    { href: "/business", icon: Building2, label: "Negocio" },
  ]

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
          <SheetTitle className="font-bold text-base tracking-tight">Agendify</SheetTitle>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {mainLinks.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={linkClass(href)} onClick={() => setOpen(false)}>
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
          {canManage && (
            <div className="pt-3">
              <p className="px-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Gestión
              </p>
              {manageLinks.map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} className={linkClass(href)} onClick={() => setOpen(false)}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
