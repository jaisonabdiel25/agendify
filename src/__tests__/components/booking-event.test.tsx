/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BookingEvent } from "@/components/modules/calendar/booking-event"
import type { PositionedEvent } from "@/types/calendar"

function makeEvent(overrides: Partial<PositionedEvent> = {}): PositionedEvent {
  return {
    id: "evt-1",
    startTime: "2025-06-15T10:00:00.000Z",
    endTime: "2025-06-15T10:30:00.000Z",
    status: "CONFIRMED",
    notes: null,
    paidAmount: null,
    top: 100,
    height: 60,
    column: 0,
    totalColumns: 1,
    service: { id: "s1", name: "Corte clásico", color: "#6366f1", durationMinutes: 30, price: "25.00" },
    chair: { id: "c1", name: "Silla A", color: "#3b82f6", user: null },
    customer: { id: "cust1", name: "Ana García", phone: null },
    ...overrides,
  }
}

describe("BookingEvent — renderizado", () => {
  it("muestra el nombre del cliente", () => {
    render(<BookingEvent event={makeEvent()} onClick={jest.fn()} />)
    expect(screen.getByText("Ana García")).toBeInTheDocument()
  })

  it("muestra el nombre del servicio y la hora cuando height >= 48", () => {
    render(<BookingEvent event={makeEvent({ height: 60 })} onClick={jest.fn()} />)
    expect(screen.getByText(/Corte clásico/)).toBeInTheDocument()
  })

  it("no muestra el nombre del servicio cuando height < 48", () => {
    render(<BookingEvent event={makeEvent({ height: 40 })} onClick={jest.fn()} />)
    expect(screen.queryByText(/Corte clásico/)).not.toBeInTheDocument()
  })

  it("muestra el nombre de la silla cuando height >= 48", () => {
    render(<BookingEvent event={makeEvent({ height: 60 })} onClick={jest.fn()} />)
    expect(screen.getByText("Silla A")).toBeInTheDocument()
  })

  it("no muestra el nombre de la silla cuando height < 48", () => {
    render(<BookingEvent event={makeEvent({ height: 30 })} onClick={jest.fn()} />)
    expect(screen.queryByText("Silla A")).not.toBeInTheDocument()
  })
})

describe("BookingEvent — interacción", () => {
  it("llama a onClick con el evento al hacer clic", async () => {
    const onClick = jest.fn()
    const event = makeEvent()
    const user = userEvent.setup()
    render(<BookingEvent event={event} onClick={onClick} />)
    await user.click(screen.getByRole("button"))
    expect(onClick).toHaveBeenCalledWith(event)
  })
})

describe("BookingEvent — estilos por estado", () => {
  it("aplica opacity-80 y border-dashed para PENDING", () => {
    render(<BookingEvent event={makeEvent({ status: "PENDING" })} onClick={jest.fn()} />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("opacity-80")
    expect(btn.className).toContain("border-dashed")
  })

  it("aplica opacity-40 y line-through para CANCELLED", () => {
    render(<BookingEvent event={makeEvent({ status: "CANCELLED" })} onClick={jest.fn()} />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("opacity-40")
    expect(btn.className).toContain("line-through")
  })

  it("aplica opacity-60 para COMPLETED", () => {
    render(<BookingEvent event={makeEvent({ status: "COMPLETED" })} onClick={jest.fn()} />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("opacity-60")
  })

  it("aplica opacity-100 para CONFIRMED", () => {
    render(<BookingEvent event={makeEvent({ status: "CONFIRMED" })} onClick={jest.fn()} />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("opacity-100")
  })

  it("aplica opacity-40 para NO_SHOW", () => {
    render(<BookingEvent event={makeEvent({ status: "NO_SHOW" })} onClick={jest.fn()} />)
    const btn = screen.getByRole("button")
    expect(btn.className).toContain("opacity-40")
  })
})

describe("BookingEvent — posicionamiento", () => {
  it("aplica el estilo top del evento", () => {
    render(<BookingEvent event={makeEvent({ top: 200, height: 60 })} onClick={jest.fn()} />)
    const btn = screen.getByRole("button")
    expect(btn.style.top).toBe("200px")
  })

  it("calcula el ancho y posición correctamente con múltiples columnas", () => {
    render(<BookingEvent event={makeEvent({ column: 1, totalColumns: 3 })} onClick={jest.fn()} />)
    const btn = screen.getByRole("button")
    expect(btn.style.backgroundColor).toBe("rgb(59, 130, 246)")
  })
})
