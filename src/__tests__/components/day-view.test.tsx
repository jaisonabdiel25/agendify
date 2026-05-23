/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DayView } from "@/components/modules/calendar/day-view"
import type { PositionedEvent } from "@/types/calendar"

const timeSlots = Array.from({ length: 8 }, (_, i) => {
  const h = 8 + Math.floor(i / 2)
  const m = i % 2 === 0 ? "00" : "30"
  return `${String(h).padStart(2, "0")}:${m}`
})

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
    customer: { id: "cust-1", name: "Juan Pérez", phone: null },
    top: 128,
    height: 64,
    column: 0,
    totalColumns: 1,
    ...overrides,
  }
}

const currentDate = new Date("2025-05-23T00:00:00")

describe("DayView — renderizado básico", () => {
  it("renderiza sin errores con lista vacía", () => {
    render(
      <DayView
        currentDate={currentDate}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText(/23/)).toBeInTheDocument()
  })

  it("muestra el número del día en el encabezado", () => {
    render(
      <DayView
        currentDate={currentDate}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText(/23 de/)).toBeInTheDocument()
  })

  it("muestra las etiquetas de las horas pares", () => {
    render(
      <DayView
        currentDate={currentDate}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("08:00")).toBeInTheDocument()
    expect(screen.getByText("09:00")).toBeInTheDocument()
  })
})

describe("DayView — eventos", () => {
  it("muestra un evento cuando bookingsForDay retorna uno", () => {
    render(
      <DayView
        currentDate={currentDate}
        timeSlots={timeSlots}
        bookingsForDay={() => [makeEvent()]}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
  })

  it("llama onEventClick al hacer clic en un evento", async () => {
    const onEventClick = jest.fn()
    const user = userEvent.setup()
    const event = makeEvent()
    render(
      <DayView
        currentDate={currentDate}
        timeSlots={timeSlots}
        bookingsForDay={() => [event]}
        onEventClick={onEventClick}
      />
    )
    await user.click(screen.getByText("Juan Pérez"))
    expect(onEventClick).toHaveBeenCalledWith(event)
  })

  it("no muestra eventos cuando no hay reservas", () => {
    render(
      <DayView
        currentDate={currentDate}
        timeSlots={timeSlots}
        bookingsForDay={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.queryByText("Juan Pérez")).not.toBeInTheDocument()
  })
})
