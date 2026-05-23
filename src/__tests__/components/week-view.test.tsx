/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WeekView } from "@/components/modules/calendar/week-view"
import type { PositionedEvent } from "@/types/calendar"

const timeSlots = Array.from({ length: 8 }, (_, i) => {
  const h = 8 + Math.floor(i / 2)
  const m = i % 2 === 0 ? "00" : "30"
  return `${String(h).padStart(2, "0")}:${m}`
})

const weekDays = [
  new Date("2025-05-19T00:00:00"),
  new Date("2025-05-20T00:00:00"),
  new Date("2025-05-21T00:00:00"),
  new Date("2025-05-22T00:00:00"),
  new Date("2025-05-23T00:00:00"),
  new Date("2025-05-24T00:00:00"),
  new Date("2025-05-25T00:00:00"),
]

function makeEvent(overrides: Partial<PositionedEvent> = {}): PositionedEvent {
  return {
    id: "evt-1",
    startTime: "2025-05-23T10:00:00Z",
    endTime: "2025-05-23T10:30:00Z",
    status: "CONFIRMED",
    notes: null,
    paidAmount: null,
    service: { id: "srv-1", name: "Corte", color: "#6366f1", durationMinutes: 30, price: "25.00" },
    chair: { id: "chair-1", name: "Silla A", color: "#6366f1", user: null },
    customer: { id: "cust-1", name: "Ana García", phone: null },
    top: 128,
    height: 64,
    column: 0,
    totalColumns: 1,
    ...overrides,
  }
}

describe("WeekView — renderizado básico", () => {
  it("renderiza sin errores con bookings vacíos", () => {
    render(
      <WeekView
        weekDays={weekDays}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("19")).toBeInTheDocument()
  })

  it("muestra los números de los 7 días de la semana", () => {
    render(
      <WeekView
        weekDays={weekDays}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("19")).toBeInTheDocument()
    expect(screen.getByText("25")).toBeInTheDocument()
  })

  it("muestra etiquetas de horas pares", () => {
    render(
      <WeekView
        weekDays={weekDays}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("08:00")).toBeInTheDocument()
  })
})

describe("WeekView — highlight del día de hoy", () => {
  it("renderiza con el día de hoy en la lista de días sin errores", () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekWithToday = [today, ...weekDays.slice(0, 6)]
    render(
      <WeekView
        weekDays={weekWithToday}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getAllByText(String(today.getDate())).length).toBeGreaterThanOrEqual(1)
  })
})

describe("WeekView — eventos", () => {
  it("muestra un evento cuando bookingsForDay lo retorna", () => {
    render(
      <WeekView
        weekDays={weekDays}
        timeSlots={timeSlots}
        bookingsForDay={(day) =>
          day.getDate() === 23 ? [makeEvent()] : []
        }
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("Ana García")).toBeInTheDocument()
  })

  it("llama onEventClick al hacer clic en un evento", async () => {
    const onEventClick = jest.fn()
    const user = userEvent.setup()
    const event = makeEvent()
    render(
      <WeekView
        weekDays={weekDays}
        timeSlots={timeSlots}
        bookingsForDay={(day) => (day.getDate() === 23 ? [event] : [])}
        onEventClick={onEventClick}
      />
    )
    await user.click(screen.getByText("Ana García"))
    expect(onEventClick).toHaveBeenCalledWith(event)
  })

  it("no muestra eventos cuando no hay reservas", () => {
    render(
      <WeekView
        weekDays={weekDays}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.queryByText("Ana García")).not.toBeInTheDocument()
  })
})
