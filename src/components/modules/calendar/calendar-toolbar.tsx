import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { CalendarView } from "@/types/calendar"

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "chairs", label: "Equipo" },
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
]

interface CalendarToolbarProps {
  view: CalendarView
  rangeLabel: string
  isLoading: boolean
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
}

export function CalendarToolbar({
  view,
  rangeLabel,
  isLoading,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: CalendarToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-border shrink-0">
      {/* Navegación */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onToday}>
          Hoy
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <span
          className={cn(
            "text-sm font-medium capitalize transition-opacity duration-150",
            isLoading && "opacity-50"
          )}
        >
          {rangeLabel}
        </span>
      </div>

      {/* Switcher de vista */}
      <div className="flex items-center rounded-md border border-border overflow-hidden">
        {VIEWS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => onViewChange(value)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium transition-colors duration-150",
              view === value
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
