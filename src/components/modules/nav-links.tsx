"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, BookOpen, Clock4, BarChart2 } from "lucide-react"
import { NavManageDropdown } from "./nav-manage-dropdown"

interface NavLinksProps {
  canManage: boolean
}

export function NavLinks({ canManage }: NavLinksProps) {
  const pathname = usePathname()

  function linkClass(href: string) {
    const isActive = pathname === href || pathname.startsWith(href + "/")
    return isActive
      ? "text-sm text-foreground font-medium transition-colors duration-150 relative after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-px after:bg-foreground"
      : "text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
  }

  return (
    <nav className="hidden sm:flex items-center gap-4 sm:gap-5">
      <Link
        href="/dashboard"
        className={`${linkClass("/dashboard")} flex items-center gap-1.5`}
      >
        <CalendarDays className="h-4 w-4" />
        Calendario
      </Link>
      <Link href="/booking" className={`${linkClass("/booking")} flex items-center gap-1.5`}>
        <BookOpen className="h-4 w-4" />
        Reservas
      </Link>
      <Link href="/schedule" className={`${linkClass("/schedule")} flex items-center gap-1.5`}>
        <Clock4 className="h-4 w-4" />
        Cronograma
      </Link>
      {canManage && (
        <Link href="/statistics" className={`${linkClass("/statistics")} flex items-center gap-1.5`}>
          <BarChart2 className="h-4 w-4" />
          Estadísticas
        </Link>
      )}
      {canManage && <NavManageDropdown />}
    </nav>
  )
}
