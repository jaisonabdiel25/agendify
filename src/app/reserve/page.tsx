import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { BookingWizard } from "@/components/modules/reserve/booking-wizard"

export default function ReservePage() {
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
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <BookingWizard />
      </div>
    </div>
  )
}
