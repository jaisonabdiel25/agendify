"use client"

import { useEffect, useRef } from "react"
import { format, isToday } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { BookingEvent } from "./booking-event"
import { GRID_START_HOUR, GRID_END_HOUR, SLOT_HEIGHT_PX } from "@/hooks/use-calendar"
import type { PositionedEvent } from "@/types/calendar"

const TOTAL_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * 2 * SLOT_HEIGHT_PX
const SCROLL_TO_HOUR = 8

interface WeekViewProps {
  weekDays: Date[]
  timeSlots: string[]
  bookingsForDay: (day: Date) => PositionedEvent[]
  onEventClick: (event: PositionedEvent) => void
}

export function WeekView({ weekDays, timeSlots, bookingsForDay, onEventClick }: WeekViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (SCROLL_TO_HOUR - GRID_START_HOUR) * 2 * SLOT_HEIGHT_PX
    }
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Header sticky — dentro del scroll para compartir el mismo ancho */}
        <div
          className="sticky top-0 z-10 grid border-b border-border bg-background"
          style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}
        >
          <div className="border-r border-border" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "py-2 text-center border-r border-border last:border-r-0",
                isToday(day) && "bg-muted/30"
              )}
            >
              <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                {format(day, "EEE", { locale: es })}
              </p>
              <p
                className={cn(
                  "text-sm font-medium mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full",
                  isToday(day) && "bg-foreground text-background"
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid" style={{ gridTemplateColumns: "4rem repeat(7, 1fr)" }}>
          {/* Columna de horas */}
          <div className="border-r border-border">
            {timeSlots.map((slot, i) => (
              <div
                key={slot}
                className="border-b border-border flex items-start justify-end pr-2"
                style={{ height: SLOT_HEIGHT_PX }}
              >
                {i % 2 === 0 && (
                  <span className="text-[0.6rem] text-muted-foreground/60 -translate-y-2">
                    {slot}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Columnas de días */}
          {weekDays.map((day) => {
            const dayBookings = bookingsForDay(day)
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-r border-border last:border-r-0",
                  isToday(day) && "bg-muted/10"
                )}
                style={{ height: TOTAL_HEIGHT }}
              >
                {/* Líneas de los slots */}
                {timeSlots.map((slot, i) => (
                  <div
                    key={slot}
                    className={cn(
                      "absolute w-full border-b",
                      i % 2 === 0 ? "border-border" : "border-border/40"
                    )}
                    style={{ top: i * SLOT_HEIGHT_PX }}
                  />
                ))}

                {/* Eventos */}
                {dayBookings.map((event) => (
                  <BookingEvent key={event.id} event={event} onClick={onEventClick} />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
