/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChairsView } from "@/components/modules/calendar/chairs-view"
import type { Chair, PositionedEvent } from "@/types/calendar"

const timeSlots = Array.from({ length: 8 }, (_, i) => {
  const h = 8 + Math.floor(i / 2)
  const m = i % 2 === 0 ? "00" : "30"
  return `${String(h).padStart(2, "0")}:${m}`
})

const chairs: Chair[] = [
  { id: "chair-1", name: "Silla A", avatarUrl: null },
  { id: "chair-2", name: "Silla B", avatarUrl: null },
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
    customer: { id: "cust-1", name: "Carlos López", phone: null },
    top: 128,
    height: 64,
    column: 0,
    totalColumns: 1,
    ...overrides,
  }
}

describe("ChairsView — renderizado de encabezados", () => {
  it("muestra los nombres de las sillas en el encabezado", () => {
    render(
      <ChairsView
        chairs={chairs}
        timeSlots={timeSlots}
        bookingsForChair={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("Silla A")).toBeInTheDocument()
    expect(screen.getByText("Silla B")).toBeInTheDocument()
  })

  it("muestra etiquetas de horas pares", () => {
    render(
      <ChairsView
        chairs={chairs}
        timeSlots={timeSlots}
        bookingsForChair={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("08:00")).toBeInTheDocument()
  })

  it("renderiza cuando la lista de sillas está vacía", () => {
    render(
      <ChairsView
        chairs={[]}
        timeSlots={timeSlots}
        bookingsForChair={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.queryByText("Silla A")).not.toBeInTheDocument()
  })
})

describe("ChairsView — eventos", () => {
  it("muestra un evento en la silla correspondiente", () => {
    render(
      <ChairsView
        chairs={chairs}
        timeSlots={timeSlots}
        bookingsForChair={(chairId) => (chairId === "chair-1" ? [makeEvent()] : [])}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.getByText("Carlos López")).toBeInTheDocument()
  })

  it("llama onEventClick al hacer clic en un evento", async () => {
    const onEventClick = jest.fn()
    const user = userEvent.setup()
    const event = makeEvent()
    render(
      <ChairsView
        chairs={chairs}
        timeSlots={timeSlots}
        bookingsForChair={(chairId) => (chairId === "chair-1" ? [event] : [])}
        onEventClick={onEventClick}
      />
    )
    await user.click(screen.getByText("Carlos López"))
    expect(onEventClick).toHaveBeenCalledWith(event)
  })

  it("no muestra eventos cuando no hay reservas", () => {
    render(
      <ChairsView
        chairs={chairs}
        timeSlots={timeSlots}
        bookingsForChair={() => []}
        onEventClick={jest.fn()}
      />
    )
    expect(screen.queryByText("Carlos López")).not.toBeInTheDocument()
  })
})
