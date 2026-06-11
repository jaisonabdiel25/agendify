"use client"

import Link from "next/link"
import { ChevronDown, User, HelpCircle } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserMenuProps {
  userName: string
  signOutAction: () => Promise<void>
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function UserMenu({ userName, signOutAction }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors outline-none">
        <span className="h-6 w-6 rounded-full bg-foreground/10 flex items-center justify-center text-[10px] font-medium text-foreground shrink-0">
          {getInitials(userName)}
        </span>
        <span className="hidden sm:inline">{userName.split(" ")[0]}</span>
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
          {userName}
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/user" className="flex items-center gap-2 cursor-pointer">
            <User className="h-3.5 w-3.5" />
            Mi perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/help" className="flex items-center gap-2 cursor-pointer">
            <HelpCircle className="h-3.5 w-3.5" />
            Ayuda
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOutAction} className="w-full">
            <button type="submit" className="w-full text-left cursor-pointer">
              Cerrar sesión
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
