"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
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
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { BookingEvent, CalendarView as CalendarViewType, Chair, PositionedEvent } from "@/types/calendar"

const STATUS_LABELS: Record<BookingEvent["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No asistió",
}

const STATUS_STYLES: Record<BookingEvent["status"], { dot: string; pill: string }> = {
  PENDING:   { dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  CONFIRMED: { dot: "bg-sky-400",     pill: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400" },
  COMPLETED: { dot: "bg-emerald-400", pill: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  CANCELLED: { dot: "bg-red-400",     pill: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  NO_SHOW:   { dot: "bg-zinc-400",    pill: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400" },
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
    updateBooking,
  } = useCalendar({ initialView, initialDate, initialBookings, initialChairs, initialShowOnlyMine })

  const [selectedEvent, setSelectedEvent] = useState<PositionedEvent | null>(null)
  const [paidAmountInput, setPaidAmountInput] = useState("")
  const [actionLoading, setActionLoading] = useState(false)

  function handleSelectEvent(event: PositionedEvent | null) {
    setSelectedEvent(event)
    setPaidAmountInput(event?.paidAmount ?? event?.service.price ?? "")
  }

  async function handleStatusAction(newStatus: BookingEvent["status"]) {
    if (!selectedEvent) return

    if (newStatus === "COMPLETED") {
      const amount = parseFloat(paidAmountInput)
      const min = parseFloat(selectedEvent.service.price)
      if (isNaN(amount) || amount < min) {
        toast.error(`El monto cobrado no puede ser menor a $${selectedEvent.service.price}`)
        return
      }
    }

    setActionLoading(true)
    try {
      const body: Record<string, unknown> = { status: newStatus }
      if (paidAmountInput.trim()) body.paidAmount = paidAmountInput.trim()

      const res = await fetch(`/api/bookings/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? "Error al actualizar la reserva")
        return
      }

      const updated: BookingEvent = await res.json()
      updateBooking(selectedEvent.id, { status: updated.status, paidAmount: updated.paidAmount })
      setSelectedEvent((prev) =>
        prev ? { ...prev, status: updated.status, paidAmount: updated.paidAmount } : null
      )
      toast.success(`Reserva ${STATUS_LABELS[updated.status].toLowerCase()}`)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSavePaidAmount() {
    if (!selectedEvent) return

    const trimmed = paidAmountInput.trim()
    if (trimmed) {
      const amount = parseFloat(trimmed)
      const min = parseFloat(selectedEvent.service.price)
      if (isNaN(amount) || amount < min) {
        toast.error(`El monto cobrado no puede ser menor a $${selectedEvent.service.price}`)
        return
      }
    }

    setActionLoading(true)
    try {
      const res = await fetch(`/api/bookings/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paidAmount: paidAmountInput.trim() || null }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error ?? "Error al guardar el monto")
        return
      }

      const updated: BookingEvent = await res.json()
      updateBooking(selectedEvent.id, { paidAmount: updated.paidAmount })
      setSelectedEvent((prev) => prev ? { ...prev, paidAmount: updated.paidAmount } : null)
      toast.success("Monto actualizado")
    } finally {
      setActionLoading(false)
    }
  }

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
          onEventClick={handleSelectEvent}
        />
      )}

      {view === "week" && (
        <WeekView
          weekDays={weekDays}
          timeSlots={timeSlots}
          bookingsForDay={bookingsForDay}
          onEventClick={handleSelectEvent}
        />
      )}

      {view === "day" && (
        <DayView
          currentDate={currentDate}
          timeSlots={timeSlots}
          bookingsForDay={bookingsForDay}
          onEventClick={handleSelectEvent}
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
      <Sheet open={!!selectedEvent} onOpenChange={(open) => !open && handleSelectEvent(null)}>
        <SheetContent className="gap-0 p-0 flex flex-col overflow-hidden">
          {selectedEvent && (
            <>
              {/* Service color accent strip */}
              <div
                className="h-0.75 w-full shrink-0"
                style={{ backgroundColor: selectedEvent.service.color }}
              />

              {/* Header */}
              <SheetHeader className="px-6 pt-5 pb-4 pr-14 gap-0 shrink-0">
                <div className="mb-2.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
                      STATUS_STYLES[selectedEvent.status].pill
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_STYLES[selectedEvent.status].dot)} />
                    {STATUS_LABELS[selectedEvent.status]}
                  </span>
                </div>
                <SheetTitle className="font-display italic text-xl leading-tight">
                  {selectedEvent.customer.name}
                </SheetTitle>
                <SheetDescription className="mt-1 text-xs capitalize">
                  {format(new Date(selectedEvent.startTime), "EEEE, d 'de' MMMM · HH:mm")} –{" "}
                  {format(new Date(selectedEvent.endTime), "HH:mm")}
                </SheetDescription>
              </SheetHeader>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                <div className="px-6 pb-6">

                  {/* Info rows */}
                  <dl className="divide-y divide-border text-sm">
                    <div className="flex justify-between items-center py-2.5">
                      <dt className="text-muted-foreground shrink-0">Servicio</dt>
                      <dd className="font-medium flex items-center gap-1.5 text-right ml-4 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: selectedEvent.service.color }}
                        />
                        <span className="truncate">{selectedEvent.service.name}</span>
                      </dd>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <dt className="text-muted-foreground">Duración</dt>
                      <dd className="font-medium">{selectedEvent.service.durationMinutes} min</dd>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <dt className="text-muted-foreground">Precio base</dt>
                      <dd className="font-medium tabular-nums">${selectedEvent.service.price}</dd>
                    </div>
                    <div className="flex justify-between items-start py-2.5">
                      <dt className="text-muted-foreground shrink-0">Colaborador</dt>
                      <dd className="font-medium text-right ml-4">
                        {selectedEvent.chair.name}
                        {selectedEvent.chair.user && (
                          <span className="block text-xs text-muted-foreground font-normal">
                            {selectedEvent.chair.user.name}
                          </span>
                        )}
                      </dd>
                    </div>
                    {selectedEvent.customer.phone && (
                      <div className="flex justify-between items-center py-2.5">
                        <dt className="text-muted-foreground">Teléfono</dt>
                        <dd className="font-medium tabular-nums">{selectedEvent.customer.phone}</dd>
                      </div>
                    )}
                  </dl>

                  {/* Notes */}
                  {selectedEvent.notes && (
                    <div className="mt-1 p-3 rounded-md bg-muted/50 text-sm">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                      <p className="text-foreground/80 leading-relaxed">{selectedEvent.notes}</p>
                    </div>
                  )}

                  {/* Monto cobrado */}
                  {(selectedEvent.status === "CONFIRMED" || selectedEvent.status === "COMPLETED") && (
                    <div className="mt-5 pt-5 border-t border-border space-y-2">
                      <Label htmlFor="paidAmount" className="text-sm font-medium">
                        Monto cobrado
                      </Label>
                      {selectedEvent.status === "COMPLETED" ? (
                        <p className="text-sm font-medium tabular-nums">
                          {selectedEvent.paidAmount
                            ? `$${selectedEvent.paidAmount}`
                            : <span className="italic text-muted-foreground/60 font-normal">Sin registrar</span>}
                        </p>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <Input
                              id="paidAmount"
                              type="number"
                              min={selectedEvent.service.price}
                              step="0.01"
                              placeholder={selectedEvent.service.price}
                              value={paidAmountInput}
                              onChange={(e) => setPaidAmountInput(e.target.value)}
                              className="h-9 text-sm tabular-nums"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading}
                              onClick={handleSavePaidAmount}
                              className="h-9 px-4 shrink-0"
                            >
                              {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Mínimo: ${selectedEvent.service.price}
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {(selectedEvent.status === "PENDING" || selectedEvent.status === "CONFIRMED") && (
                    <div className="mt-5 pt-5 border-t border-border space-y-2">
                      {selectedEvent.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
                            disabled={actionLoading}
                            onClick={() => handleStatusAction("CONFIRMED")}
                          >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 text-destructive border-destructive/40 hover:bg-destructive/5"
                            disabled={actionLoading}
                            onClick={() => handleStatusAction("CANCELLED")}
                          >
                            Cancelar
                          </Button>
                        </div>
                      )}

                      {selectedEvent.status === "CONFIRMED" && (
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                            disabled={actionLoading}
                            onClick={() => handleStatusAction("COMPLETED")}
                          >
                            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Completar reserva"}
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 text-sm"
                              disabled={actionLoading}
                              onClick={() => handleStatusAction("NO_SHOW")}
                            >
                              No asistió
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 text-sm text-destructive border-destructive/40 hover:bg-destructive/5"
                              disabled={actionLoading}
                              onClick={() => handleStatusAction("CANCELLED")}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
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
