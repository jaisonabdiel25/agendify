"use client"

import { useEffect, useRef } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { BookingEvent } from "./booking-event"
import { GRID_START_HOUR, GRID_END_HOUR, SLOT_HEIGHT_PX } from "@/hooks/use-calendar"
import type { PositionedEvent } from "@/types/calendar"

const TOTAL_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * 2 * SLOT_HEIGHT_PX
const SCROLL_TO_HOUR = 8

interface DayViewProps {
  currentDate: Date
  timeSlots: string[]
  bookingsForDay: (day: Date) => PositionedEvent[]
  onEventClick: (event: PositionedEvent) => void
}

export function DayView({ currentDate, timeSlots, bookingsForDay, onEventClick }: DayViewProps) {
  const dayBookings = bookingsForDay(currentDate)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = (SCROLL_TO_HOUR - GRID_START_HOUR) * 2 * SLOT_HEIGHT_PX
    }
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 border-b border-border">
        <div className="w-16 shrink-0 border-r border-border" />
        <div className="flex-1 py-2 px-4">
          <p className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
            {format(currentDate, "EEEE")}
          </p>
          <p className="text-sm font-medium mt-0.5">{format(currentDate, "d 'de' MMMM yyyy")}</p>
        </div>
      </div>

      {/* Grid con scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
        <div className="flex">
          {/* Columna de horas */}
          <div className="w-16 shrink-0 border-r border-border">
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

          {/* Columna del día */}
          <div className="flex-1 relative" style={{ height: TOTAL_HEIGHT }}>
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
            {dayBookings.map((event) => (
              <BookingEvent key={event.id} event={event} onClick={onEventClick} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
