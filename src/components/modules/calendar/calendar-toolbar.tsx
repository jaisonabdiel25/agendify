import { ChevronLeft, ChevronRight, Users, User } from "lucide-react"
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
  showOnlyMine: boolean
  canToggle: boolean
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onToggleOnlyMine: () => void
}

export function CalendarToolbar({
  view,
  rangeLabel,
  isLoading,
  showOnlyMine,
  canToggle,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  onToggleOnlyMine,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border shrink-0">
      {/* Navegación */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
        <Button variant="outline" size="sm" onClick={onToday} className="text-xs sm:text-sm h-7 sm:h-8 px-2.5 sm:px-3">
          Hoy
        </Button>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={onPrev}>
            <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={onNext}>
            <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
        <span
          className={cn(
            "text-xs sm:text-sm font-medium capitalize transition-opacity duration-150 truncate",
            isLoading && "opacity-50"
          )}
        >
          {rangeLabel}
        </span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Toggle mis reservas / todas */}
        {canToggle && (
          <Button
            variant={showOnlyMine ? "default" : "outline"}
            size="sm"
            onClick={onToggleOnlyMine}
            className="gap-1 sm:gap-1.5 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3"
          >
            {showOnlyMine ? (
              <>
                <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden xs:inline">Mis reservas</span>
                <span className="xs:hidden">Mías</span>
              </>
            ) : (
              <>
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Todas
              </>
            )}
          </Button>
        )}

        {/* Switcher de vista */}
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          {VIEWS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 text-[0.65rem] sm:text-xs font-medium transition-colors duration-150",
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
    </div>
  )
}
