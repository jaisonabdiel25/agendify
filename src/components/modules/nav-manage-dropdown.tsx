"use client"

import Link from "next/link"
import { Armchair, Building2, ChevronDown, Scissors, Users } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function NavManageDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none">
        Gestión
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <Link href="/chair" className="flex items-center gap-2">
            <Armchair className="h-3.5 w-3.5 text-muted-foreground" />
            Puestos
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/service" className="flex items-center gap-2">
            <Scissors className="h-3.5 w-3.5 text-muted-foreground" />
            Servicios
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/user/admin" className="flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            Equipo
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/business" className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            Negocio
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
