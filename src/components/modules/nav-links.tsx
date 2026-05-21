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
      ? "text-sm text-foreground font-medium transition-colors duration-150 relative after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-px after:bg-foreground"
      : "text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
  }

  return (
    <nav className="flex items-center gap-4 sm:gap-5 overflow-x-auto scrollbar-none">
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
