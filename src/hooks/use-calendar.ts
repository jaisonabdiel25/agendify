"use client"

import { useState, useEffect, useTransition, useMemo, useCallback } from "react"
import {
  startOfWeek,
  endOfWeek,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  addMonths,
  subMonths,
  eachDayOfInterval,
  getHours,
  getMinutes,
  differenceInMinutes,
  isSameDay,
  format,
} from "date-fns"
import type { BookingEvent, CalendarView, Chair, PositionedEvent } from "@/types/calendar"

const GRID_START_HOUR = 8
const GRID_END_HOUR = 22
const SLOT_HEIGHT_PX = 64

function getDateRange(date: Date, view: CalendarView): { from: Date; to: Date } {
  switch (view) {
    case "week":
      return {
        from: startOfWeek(date, { weekStartsOn: 1 }),
        to: endOfWeek(date, { weekStartsOn: 1 }),
      }
    case "day":
    case "chairs":
      return { from: startOfDay(date), to: endOfDay(date) }
    case "month":
      return { from: startOfMonth(date), to: endOfMonth(date) }
  }
}

function navigateDate(date: Date, view: CalendarView, direction: 1 | -1): Date {
  switch (view) {
    case "week":
      return direction === 1 ? addWeeks(date, 1) : subWeeks(date, 1)
    case "day":
    case "chairs":
      return direction === 1 ? addDays(date, 1) : subDays(date, 1)
    case "month":
      return direction === 1 ? addMonths(date, 1) : subMonths(date, 1)
  }
}

function getEventPosition(event: BookingEvent): { top: number; height: number } {
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const startMinutes = (getHours(start) - GRID_START_HOUR) * 60 + getMinutes(start)
  const duration = differenceInMinutes(end, start)
  return {
    top: (startMinutes / 30) * SLOT_HEIGHT_PX,
    height: Math.max((duration / 30) * SLOT_HEIGHT_PX, SLOT_HEIGHT_PX / 2),
  }
}

function resolveOverlaps(events: BookingEvent[]): PositionedEvent[] {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const positioned: PositionedEvent[] = sorted.map((e) => ({
    ...e,
    ...getEventPosition(e),
    column: 0,
    totalColumns: 1,
  }))

  for (let i = 0; i < positioned.length; i++) {
    const overlapping = [positioned[i]]
    for (let j = i + 1; j < positioned.length; j++) {
      const aEnd = new Date(positioned[i].endTime).getTime()
      const bStart = new Date(positioned[j].startTime).getTime()
      if (bStart < aEnd) overlapping.push(positioned[j])
    }
    if (overlapping.length > 1) {
      overlapping.forEach((ev, idx) => {
        ev.column = idx
        ev.totalColumns = overlapping.length
      })
    }
  }

  return positioned
}

function buildTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = GRID_START_HOUR; h < GRID_END_HOUR; h++) {
    slots.push(`${String(h).padStart(2, "0")}:00`)
    slots.push(`${String(h).padStart(2, "0")}:30`)
  }
  return slots
}

interface UseCalendarOptions {
  initialView: CalendarView
  initialDate: string
  initialBookings: BookingEvent[]
  initialChairs: Chair[]
  initialShowOnlyMine: boolean
}

export function useCalendar({ initialView, initialDate, initialBookings, initialChairs, initialShowOnlyMine }: UseCalendarOptions) {
  const [view, setView] = useState<CalendarView>(initialView)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(initialDate))
  const [bookings, setBookings] = useState<BookingEvent[]>(initialBookings)
  const [chairs] = useState<Chair[]>(initialChairs)
  const [isLoading, startTransition] = useTransition()
  const [showOnlyMine, setShowOnlyMine] = useState(initialShowOnlyMine)
  const [loadedRange, setLoadedRange] = useState<{ from: Date; to: Date; onlyMine: boolean }>(() => ({
    ...getDateRange(new Date(initialDate), initialView),
    onlyMine: initialShowOnlyMine,
  }))

  useEffect(() => {
    const range = getDateRange(currentDate, view)
    const alreadyLoaded =
      range.from.getTime() === loadedRange.from.getTime() &&
      range.to.getTime() === loadedRange.to.getTime() &&
      showOnlyMine === loadedRange.onlyMine

    if (alreadyLoaded) return

    const params = new URLSearchParams({
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    })
    if (showOnlyMine) params.set("onlyMine", "true")

    startTransition(async () => {
      const res = await fetch(`/api/bookings?${params}`)
      const data: BookingEvent[] = await res.json()
      setBookings(data)
      setLoadedRange({ ...range, onlyMine: showOnlyMine })
    })
  }, [view, currentDate, showOnlyMine]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateBooking = useCallback((id: string, updates: Partial<BookingEvent>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)))
  }, [])

  const goToToday = useCallback(() => setCurrentDate(new Date()), [])
  const goToPrev = useCallback(() => setCurrentDate((d) => navigateDate(d, view, -1)), [view])
  const goToNext = useCallback(() => setCurrentDate((d) => navigateDate(d, view, 1)), [view])
  const goToDate = useCallback((date: Date) => setCurrentDate(date), [])

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const timeSlots = useMemo(() => buildTimeSlots(), [])

  const positionedBookings = useMemo(() => resolveOverlaps(bookings), [bookings])

  const bookingsForDay = useCallback(
    (day: Date) => positionedBookings.filter((b) => isSameDay(new Date(b.startTime), day)),
    [positionedBookings]
  )

  const bookingsForChair = useCallback(
    (chairId: string) => {
      const filtered = bookings.filter(
        (b) => b.chair.id === chairId && isSameDay(new Date(b.startTime), currentDate)
      )
      return resolveOverlaps(filtered)
    },
    [bookings, currentDate]
  )

  const rangeLabel = useMemo(() => {
    switch (view) {
      case "week": {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 })
        const end = endOfWeek(currentDate, { weekStartsOn: 1 })
        if (start.getMonth() === end.getMonth()) {
          return `${format(start, "d")} – ${format(end, "d 'de' MMMM yyyy")}`
        }
        return `${format(start, "d MMM")} – ${format(end, "d MMM yyyy")}`
      }
      case "day":
      case "chairs":
        return format(currentDate, "EEEE, d 'de' MMMM yyyy")
      case "month":
        return format(currentDate, "MMMM yyyy")
    }
  }, [view, currentDate])

  return {
    view,
    currentDate,
    bookings,
    chairs,
    isLoading,
    weekDays,
    timeSlots,
    positionedBookings,
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
    GRID_START_HOUR,
    GRID_END_HOUR,
    SLOT_HEIGHT_PX,
  }
}
