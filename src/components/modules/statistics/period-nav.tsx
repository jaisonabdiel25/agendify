"use client"

import { useRouter } from "next/navigation"
import { parseISO, addMonths, subMonths, format, isAfter, startOfMonth } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PeriodNavProps {
  currentMonth: string
}

export function PeriodNav({ currentMonth }: PeriodNavProps) {
  const router = useRouter()
  const current = parseISO(`${currentMonth}-01`)
  const prev = subMonths(current, 1)
  const next = addMonths(current, 1)
  const isNextInFuture = isAfter(startOfMonth(next), startOfMonth(new Date()))

  function navigate(d: Date) {
    router.push(`/statistics?month=${format(d, "yyyy-MM")}`)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate(prev)}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="text-sm font-medium min-w-36 text-center capitalize">
        {format(current, "MMMM yyyy", { locale: es })}
      </span>
      <button
        onClick={() => navigate(next)}
        disabled={isNextInFuture}
        className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:pointer-events-none"
        aria-label="Mes siguiente"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
