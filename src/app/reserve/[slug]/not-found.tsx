import Link from "next/link"
import { ChevronLeft, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BusinessNotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 flex h-14 items-center justify-between">
          <Link
            href="/"
            className="font-bold text-base tracking-tight hover:opacity-80 transition-opacity"
          >
            Agendify
          </Link>
          <Link
            href="/reserve"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Buscar negocio
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <SearchX className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="font-display font-light text-3xl">Negocio no encontrado</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El link que usaste no corresponde a ningún negocio activo en Agendify.
              Puede que el enlace esté desactualizado o el negocio ya no esté disponible.
            </p>
          </div>

          <Button asChild>
            <Link href="/reserve">Buscar otro negocio</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
