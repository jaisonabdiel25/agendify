"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-5xl mx-auto px-5 sm:px-6 flex h-14 items-center justify-between">
        <Link
          href="/"
          className="font-bold text-base tracking-tight hover:opacity-80 transition-opacity"
        >
          Agendify
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
          <a
            href="#features"
            className="hover:text-foreground transition-colors duration-150"
          >
            Características
          </a>
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/register">Comenzar</Link>
          </Button>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-muted transition-colors ml-1"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <div className="max-w-5xl mx-auto px-5 py-4 flex flex-col gap-1">
            <a
              href="#features"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Características
            </a>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted/60 transition-colors"
            >
              Comenzar gratis →
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
