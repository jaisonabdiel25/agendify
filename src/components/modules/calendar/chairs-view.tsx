"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { BookingEvent } from "./booking-event"
import type { Chair, PositionedEvent } from "@/types/calendar"

const GRID_START_HOUR = 0
const GRID_END_HOUR = 24
const SLOT_HEIGHT_PX = 64
const TOTAL_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * 2 * SLOT_HEIGHT_PX
const SCROLL_TO_HOUR = 8

interface ChairsViewProps {
  chairs: Chair[]
  timeSlots: string[]
  bookingsForChair: (chairId: string) => PositionedEvent[]
  onEventClick: (event: PositionedEvent) => void
}

export function ChairsView({ chairs, timeSlots, bookingsForChair, onEventClick }: ChairsViewProps) {
  const colCount = chairs.length || 1
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = SCROLL_TO_HOUR * 2 * SLOT_HEIGHT_PX
    }
  }, [])

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Header sticky — dentro del scroll para compartir el mismo ancho */}
        <div
          className="sticky top-0 z-10 grid border-b border-border bg-background"
          style={{ gridTemplateColumns: `4rem repeat(${colCount}, 1fr)` }}
        >
          <div className="border-r border-border" />
          {chairs.map((chair) => (
            <div
              key={chair.id}
              className="py-3 text-center border-r border-border last:border-r-0"
            >
              <p className="text-sm font-medium truncate px-2">{chair.name}</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid" style={{ gridTemplateColumns: `4rem repeat(${colCount}, 1fr)` }}>
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

          {/* Columna por chair */}
          {chairs.map((chair) => {
            const events = bookingsForChair(chair.id)
            return (
              <div
                key={chair.id}
                className="relative border-r border-border last:border-r-0"
                style={{ height: TOTAL_HEIGHT }}
              >
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
                {events.map((event) => (
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
