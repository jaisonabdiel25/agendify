import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isSameMonth,
  isSameDay,
} from "date-fns"
import { es } from "date-fns/locale"
import { cn, getContrastTextColor } from "@/lib/utils"
import type { BookingEvent } from "@/types/calendar"

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
const MAX_VISIBLE = 3

interface MonthViewProps {
  currentDate: Date
  bookings: BookingEvent[]
  onDayClick: (day: Date) => void
}

export function MonthView({ currentDate, bookings, onDayClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  function bookingsForDay(day: Date) {
    return bookings.filter((b) => isSameDay(new Date(b.startTime), day))
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Cabecera de días de la semana */}
      <div className="grid grid-cols-7 shrink-0 border-b border-border">
        {DAY_NAMES.map((name) => (
          <div key={name} className="py-2 text-center">
            <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
              {name}
            </span>
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {days.map((day) => {
          const dayBookings = bookingsForDay(day)
          const extra = dayBookings.length - MAX_VISIBLE
          const inMonth = isSameMonth(day, currentDate)

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={cn(
                "group flex flex-col p-1.5 border-b border-r border-border text-left",
                "hover:bg-muted/30 transition-colors duration-150 focus:outline-none focus:bg-muted/30",
                !inMonth && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                  isToday(day) && "bg-foreground text-background"
                )}
              >
                {format(day, "d")}
              </span>

              <div className="flex flex-col gap-0.5 w-full overflow-hidden">
                {dayBookings.slice(0, MAX_VISIBLE).map((b) => (
                  <div
                    key={b.id}
                    className="rounded px-1 py-0.5 text-[0.6rem] leading-tight truncate"
                    style={{
                      backgroundColor: b.chair.color,
                      color: getContrastTextColor(b.chair.color),
                    }}
                  >
                    {format(new Date(b.startTime), "HH:mm")} {b.customer.name}
                  </div>
                ))}
                {extra > 0 && (
                  <span className="text-[0.6rem] text-muted-foreground pl-1">
                    +{extra} más
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
