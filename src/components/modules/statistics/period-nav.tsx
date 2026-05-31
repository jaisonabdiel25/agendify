"use client"

import { useRouter } from "next/navigation"
import { parseISO, addMonths, subMonths, format } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PeriodNavProps {
  currentMonth: string
  view: "month" | "all"
}

export function PeriodNav({ currentMonth, view }: PeriodNavProps) {
  const router = useRouter()
  const current = parseISO(`${currentMonth}-01`)
  const prev = subMonths(current, 1)
  const next = addMonths(current, 1)

  function navigate(d: Date) {
    router.push(`/statistics?month=${format(d, "yyyy-MM")}&view=month`)
  }

  function setView(v: "month" | "all") {
    if (v === "all") {
      router.push("/statistics?view=all")
    } else {
      router.push(`/statistics?month=${currentMonth}&view=month`)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex rounded-md border border-border overflow-hidden">
        <button
          onClick={() => setView("month")}
          className={cn(
            "px-3 py-1.5 text-sm transition-colors",
            view === "month"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Por mes
        </button>
        <button
          onClick={() => setView("all")}
          className={cn(
            "px-3 py-1.5 text-sm transition-colors border-l border-border",
            view === "all"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          Global
        </button>
      </div>

      {view === "month" && (
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
            className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
