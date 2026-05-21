"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { NavManageDropdown } from "./nav-manage-dropdown"

interface NavLinksProps {
  canManage: boolean
}

export function NavLinks({ canManage }: NavLinksProps) {
  const pathname = usePathname()

  function linkClass(href: string) {
    const isActive = pathname === href || pathname.startsWith(href + "/")
    return isActive
      ? "text-sm text-foreground font-medium transition-colors"
      : "text-sm text-muted-foreground hover:text-foreground transition-colors"
  }

  return (
    <nav className="flex items-center gap-5">
      <Link href="/booking" className={linkClass("/booking")}>
        Reservas
      </Link>
      <Link href="/schedule" className={linkClass("/schedule")}>
        Cronograma
      </Link>
      {canManage && <NavManageDropdown />}
    </nav>
  )
}
