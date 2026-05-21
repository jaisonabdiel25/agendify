"use client"

import { useState } from "react"
import { format } from "date-fns"
import { useCalendar } from "@/hooks/use-calendar"
import { CalendarToolbar } from "./calendar-toolbar"
import { ChairsView } from "./chairs-view"
import { WeekView } from "./week-view"
import { DayView } from "./day-view"
import { MonthView } from "./month-view"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import type { BookingEvent, CalendarView as CalendarViewType, Chair, PositionedEvent } from "@/types/calendar"

const STATUS_LABELS: Record<BookingEvent["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
}

const STATUS_VARIANTS: Record<
  BookingEvent["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  CONFIRMED: "default",
  COMPLETED: "secondary",
  CANCELLED: "destructive",
  NO_SHOW: "secondary",
}

interface CalendarViewProps {
  initialBookings: BookingEvent[]
  initialDate: string
  initialView: CalendarViewType
  initialChairs: Chair[]
  initialShowOnlyMine: boolean
  canToggle: boolean
}

export function CalendarView({ initialBookings, initialDate, initialView, initialChairs, initialShowOnlyMine, canToggle }: CalendarViewProps) {
  const {
    view,
    currentDate,
    bookings,
    chairs,
    isLoading,
    weekDays,
    timeSlots,
    bookingsForDay,
    bookingsForChair,
    rangeLabel,
    showOnlyMine,
    setShowOnlyMine,
    setView,
    goToToday,
    goToPrev,
    goToNext,
    goToDate,
  } = useCalendar({ initialView, initialDate, initialBookings, initialChairs, initialShowOnlyMine })

  const [selectedEvent, setSelectedEvent] = useState<PositionedEvent | null>(null)

  function handleDayClick(day: Date) {
    goToDate(day)
    setView("day")
  }

  return (
    <div className="flex flex-col h-full border border-border rounded-lg overflow-hidden bg-background">
      <CalendarToolbar
        view={view}
        rangeLabel={rangeLabel}
        isLoading={isLoading}
        showOnlyMine={showOnlyMine}
        canToggle={canToggle}
        onViewChange={setView}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        onToggleOnlyMine={() => setShowOnlyMine((v) => !v)}
      />

      {view === "chairs" && (
        <ChairsView
          chairs={chairs}
          timeSlots={timeSlots}
          bookingsForChair={bookingsForChair}
          onEventClick={setSelectedEvent}
        />
      )}

      {view === "week" && (
        <WeekView
          weekDays={weekDays}
          timeSlots={timeSlots}
          bookingsForDay={bookingsForDay}
          onEventClick={setSelectedEvent}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          timeSlots={timeSlots}
          bookingsForDay={bookingsForDay}
          onEventClick={setSelectedEvent}
        />
      )}

      {view === "month" && (
        <MonthView
          currentDate={currentDate}
          bookings={bookings}
          onDayClick={handleDayClick}
        />
      )}

      {/* Sheet de detalle de reserva */}
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <SheetContent>
          {selectedEvent && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedEvent.customer.name}</SheetTitle>
                <SheetDescription>
                  {format(new Date(selectedEvent.startTime), "EEEE, d 'de' MMMM · HH:mm")} –{" "}
                  {format(new Date(selectedEvent.endTime), "HH:mm")}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[selectedEvent.status]}>
                    {STATUS_LABELS[selectedEvent.status]}
                  </Badge>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicio</span>
                    <span className="font-medium flex items-center gap-2">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: selectedEvent.service.color }}
                      />
                      {selectedEvent.service.name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duración</span>
                    <span className="font-medium">{selectedEvent.service.durationMinutes} min</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Colaborador</span>
                    <span className="font-medium">{selectedEvent.chair.name}</span>
                  </div>

                  {selectedEvent.customer.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono</span>
                      <span className="font-medium">{selectedEvent.customer.phone}</span>
                    </div>
                  )}

                  {selectedEvent.notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-muted-foreground text-xs mb-1">Notas</p>
                      <p>{selectedEvent.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
