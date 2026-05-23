/**
 * @jest-environment jsdom
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MonthView } from "@/components/modules/calendar/month-view"
import type { BookingEvent } from "@/types/calendar"

function makeBooking(overrides: Partial<BookingEvent> = {}): BookingEvent {
  return {
    id: "evt-1",
    startTime: "2025-05-15T10:00:00Z",
    endTime: "2025-05-15T10:30:00Z",
    status: "CONFIRMED",
    notes: null,
    paidAmount: null,
    service: { id: "srv-1", name: "Corte", color: "#6366f1", durationMinutes: 30, price: "25.00" },
    chair: { id: "chair-1", name: "Silla A", color: "#6366f1", user: null },
    customer: { id: "cust-1", name: "María Torres", phone: null },
    ...overrides,
  }
}

const currentDate = new Date("2025-05-15T00:00:00")

describe("MonthView — encabezados de días", () => {
  it("muestra los nombres de los días de la semana", () => {
    render(
      <MonthView
        currentDate={currentDate}
        bookings={[]}
        onDayClick={jest.fn()}
      />
    )
    expect(screen.getByText("Lun")).toBeInTheDocument()
    expect(screen.getByText("Mar")).toBeInTheDocument()
    expect(screen.getByText("Mié")).toBeInTheDocument()
    expect(screen.getByText("Jue")).toBeInTheDocument()
    expect(screen.getByText("Vie")).toBeInTheDocument()
    expect(screen.getByText("Sáb")).toBeInTheDocument()
    expect(screen.getByText("Dom")).toBeInTheDocument()
  })

  it("muestra el número 15 en la celda del día 15", () => {
    render(
      <MonthView
        currentDate={currentDate}
        bookings={[]}
        onDayClick={jest.fn()}
      />
    )
    const dayButtons = screen.getAllByRole("button")
    const day15 = dayButtons.find((btn) => btn.textContent?.includes("15"))
    expect(day15).toBeInTheDocument()
  })
})

describe("MonthView — navegación", () => {
  it("llama onDayClick al hacer clic en un día", async () => {
    const onDayClick = jest.fn()
    const user = userEvent.setup()
    render(
      <MonthView
        currentDate={currentDate}
        bookings={[]}
        onDayClick={onDayClick}
      />
    )
    const dayButtons = screen.getAllByRole("button")
    await user.click(dayButtons[0])
    expect(onDayClick).toHaveBeenCalled()
  })
})

describe("MonthView — reservas", () => {
  it("muestra el nombre del cliente en el día correspondiente", () => {
    render(
      <MonthView
        currentDate={currentDate}
        bookings={[makeBooking()]}
        onDayClick={jest.fn()}
      />
    )
    expect(screen.getByText(/María Torres/)).toBeInTheDocument()
  })

  it("muestra '+N más' cuando hay más de 3 reservas en un día", () => {
    const bookings = Array.from({ length: 5 }, (_, i) =>
      makeBooking({ id: `evt-${i}`, customer: { id: `cust-${i}`, name: `Cliente ${i}`, phone: null } })
    )
    render(
      <MonthView
        currentDate={currentDate}
        bookings={bookings}
        onDayClick={jest.fn()}
      />
    )
    expect(screen.getByText(/\+2 más/)).toBeInTheDocument()
  })

  it("no muestra '+N más' cuando hay 3 o menos reservas", () => {
    const bookings = Array.from({ length: 3 }, (_, i) =>
      makeBooking({ id: `evt-${i}`, customer: { id: `cust-${i}`, name: `Cliente ${i}`, phone: null } })
    )
    render(
      <MonthView
        currentDate={currentDate}
        bookings={bookings}
        onDayClick={jest.fn()}
      />
    )
    expect(screen.queryByText(/más/)).not.toBeInTheDocument()
  })

  it("no muestra reservas de otros meses en el día actual", () => {
    render(
      <MonthView
        currentDate={currentDate}
        bookings={[makeBooking({ startTime: "2025-06-15T10:00:00Z", endTime: "2025-06-15T10:30:00Z" })]}
        onDayClick={jest.fn()}
      />
    )
    expect(screen.queryByText("María Torres")).not.toBeInTheDocument()
  })
})
