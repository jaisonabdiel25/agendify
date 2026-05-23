/**
 * @jest-environment jsdom
 */

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }))

jest.mock("@/hooks/use-calendar", () => ({
  useCalendar: jest.fn(),
  GRID_START_HOUR: 8,
  GRID_END_HOUR: 22,
  SLOT_HEIGHT_PX: 64,
}))

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CalendarView } from "@/components/modules/calendar/calendar-view"
import { useCalendar } from "@/hooks/use-calendar"
import { toast } from "sonner"
import type { BookingEvent, PositionedEvent } from "@/types/calendar"

const mockToast = toast as { success: jest.Mock; error: jest.Mock }
const mockUseCalendar = useCalendar as jest.Mock

const timeSlots = Array.from({ length: 4 }, (_, i) => {
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
    status: "PENDING",
    notes: null,
    paidAmount: null,
    service: { id: "srv-1", name: "Corte", color: "#6366f1", durationMinutes: 30, price: "25.00" },
    chair: { id: "chair-1", name: "Silla A", color: "#6366f1", user: null },
    customer: { id: "cust-1", name: "Pedro Ruiz", phone: null },
    top: 128,
    height: 64,
    column: 0,
    totalColumns: 1,
    ...overrides,
  }
}

const defaultHook = {
  view: "day" as const,
  currentDate: new Date("2025-05-23T00:00:00"),
  bookings: [] as BookingEvent[],
  chairs: [],
  isLoading: false,
  weekDays,
  timeSlots,
  bookingsForDay: () => [],
  bookingsForChair: () => [],
  rangeLabel: "23 mayo 2025",
  showOnlyMine: false,
  setShowOnlyMine: jest.fn(),
  setView: jest.fn(),
  goToToday: jest.fn(),
  goToPrev: jest.fn(),
  goToNext: jest.fn(),
  goToDate: jest.fn(),
  updateBooking: jest.fn(),
}

const defaultProps = {
  initialBookings: [],
  initialDate: "2025-05-23",
  initialView: "day" as const,
  initialChairs: [],
  initialShowOnlyMine: false,
  canToggle: false,
}

beforeEach(() => {
  jest.clearAllMocks()
  mockUseCalendar.mockReturnValue({ ...defaultHook })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: "evt-1", status: "CONFIRMED", paidAmount: null }),
  } as Response)
})

// ─── Renderizado básico ───────────────────────────────────────────────────────

describe("CalendarView — renderizado básico", () => {
  it("renderiza el toolbar del calendario", () => {
    render(<CalendarView {...defaultProps} />)
    expect(screen.getByText("23 mayo 2025")).toBeInTheDocument()
  })

  it("muestra la vista day con la fecha actual", () => {
    render(<CalendarView {...defaultProps} />)
    expect(screen.getByText(/23 de/)).toBeInTheDocument()
  })

  it("renderiza sin errores cuando isLoading es true", () => {
    mockUseCalendar.mockReturnValue({ ...defaultHook, isLoading: true })
    render(<CalendarView {...defaultProps} />)
    expect(screen.getByText("23 mayo 2025")).toBeInTheDocument()
  })
})

// ─── Vistas ───────────────────────────────────────────────────────────────────

describe("CalendarView — vistas", () => {
  it("muestra WeekView cuando view es week", () => {
    mockUseCalendar.mockReturnValue({ ...defaultHook, view: "week" as const })
    render(<CalendarView {...defaultProps} initialView="week" />)
    expect(screen.getByText("19")).toBeInTheDocument()
    expect(screen.getByText("25")).toBeInTheDocument()
  })

  it("muestra MonthView cuando view es month", () => {
    mockUseCalendar.mockReturnValue({ ...defaultHook, view: "month" as const })
    render(<CalendarView {...defaultProps} initialView="month" />)
    expect(screen.getByText("Lun")).toBeInTheDocument()
  })

  it("muestra ChairsView cuando view es chairs", () => {
    const chairs = [
      { id: "chair-1", name: "Silla A", avatarUrl: null },
      { id: "chair-2", name: "Silla B", avatarUrl: null },
    ]
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      view: "chairs" as const,
      chairs,
    })
    render(<CalendarView {...defaultProps} initialView="chairs" />)
    expect(screen.getByText("Silla A")).toBeInTheDocument()
  })
})

// ─── Sheet de detalle ─────────────────────────────────────────────────────────

describe("CalendarView — sheet de detalle de reserva", () => {
  it("abre el sheet al hacer clic en un evento", async () => {
    const user = userEvent.setup()
    const event = makeEvent()
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })
  })

  it("muestra el nombre del cliente en el sheet", async () => {
    const user = userEvent.setup()
    const event = makeEvent()
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      const dialogs = screen.getAllByText("Pedro Ruiz")
      expect(dialogs.length).toBeGreaterThanOrEqual(1)
    })
  })

  it("muestra el nombre del servicio en el sheet", async () => {
    const user = userEvent.setup()
    const event = makeEvent()
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByText("Corte")).toBeInTheDocument()
    })
  })

  it("muestra el badge de estado Pendiente para evento PENDING", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "PENDING" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByText("Pendiente")).toBeInTheDocument()
    })
  })
})

// ─── Acciones de estado ───────────────────────────────────────────────────────

describe("CalendarView — acciones de estado", () => {
  it("muestra botón Confirmar para evento PENDING", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "PENDING" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Confirmar" })).toBeInTheDocument()
    })
  })

  it("llama fetch PATCH al confirmar una reserva pendiente", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "PENDING" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Confirmar" }))
    await user.click(screen.getByRole("button", { name: "Confirmar" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/bookings/evt-1",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("muestra toast de éxito al confirmar", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "PENDING" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Confirmar" }))
    await user.click(screen.getByRole("button", { name: "Confirmar" }))
    await waitFor(() => expect(mockToast.success).toHaveBeenCalled())
  })

  it("muestra toast de error cuando la API falla", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error al actualizar la reserva" }),
    } as Response)
    const user = userEvent.setup()
    const event = makeEvent({ status: "PENDING" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Confirmar" }))
    await user.click(screen.getByRole("button", { name: "Confirmar" }))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
  })

  it("muestra botones Completar reserva y No asistió para evento CONFIRMED", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "CONFIRMED" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Completar reserva" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "No asistió" })).toBeInTheDocument()
    })
  })

  it("valida monto mínimo al completar una reserva", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "CONFIRMED" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Completar reserva" }))
    // Clear the paid amount input and set value below minimum
    const input = screen.getByPlaceholderText("25.00")
    await user.clear(input)
    await user.type(input, "10")
    await user.click(screen.getByRole("button", { name: "Completar reserva" }))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
  })

  it("muestra notas cuando el evento las tiene", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ notes: "Traer toalla propia" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByText("Traer toalla propia")).toBeInTheDocument()
    })
  })

  it("muestra el teléfono del cliente en el sheet cuando está disponible", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ customer: { id: "cust-1", name: "Pedro Ruiz", phone: "+507 6123-4567" } })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByText("+507 6123-4567")).toBeInTheDocument()
    })
  })

  it("cancela una reserva CONFIRMED al hacer clic en Cancelar", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "CONFIRMED" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Cancelar" }))
    const cancelBtn = screen.getByRole("button", { name: "Cancelar" })
    await user.click(cancelBtn)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/bookings/evt-1",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("guarda el monto cobrado al hacer clic en Guardar", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "CONFIRMED" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Guardar" }))
    const input = screen.getByPlaceholderText("25.00")
    await user.clear(input)
    await user.type(input, "30.00")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/bookings/evt-1",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("muestra error al guardar monto menor al precio mínimo", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "CONFIRMED" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Guardar" }))
    const input = screen.getByPlaceholderText("25.00")
    await user.clear(input)
    await user.type(input, "10")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
  })

  it("muestra evento COMPLETED con monto cobrado registrado", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "COMPLETED", paidAmount: "30.00" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByText("$30.00")).toBeInTheDocument()
    })
  })

  it("muestra 'Sin registrar' para evento COMPLETED sin monto cobrado", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "COMPLETED", paidAmount: null })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByText("Sin registrar")).toBeInTheDocument()
    })
  })

  it("muestra el usuario asignado a la silla cuando existe", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ chair: { id: "chair-1", name: "Silla A", color: "#6366f1", user: { id: "u-1", name: "Luis Morales" } } })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => {
      expect(screen.getByText("Luis Morales")).toBeInTheDocument()
    })
  })

  it("cancela una reserva PENDING al hacer clic en Cancelar", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "PENDING" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Cancelar" }))
    await user.click(screen.getByRole("button", { name: "Cancelar" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/bookings/evt-1",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("registra No asistió para evento CONFIRMED", async () => {
    const user = userEvent.setup()
    const event = makeEvent({ status: "CONFIRMED" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "No asistió" }))
    await user.click(screen.getByRole("button", { name: "No asistió" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/bookings/evt-1",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("muestra error cuando falla el fetch al guardar el monto", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error al guardar" }),
    } as Response)
    const user = userEvent.setup()
    const event = makeEvent({ status: "CONFIRMED" })
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      bookingsForDay: () => [event],
    })
    render(<CalendarView {...defaultProps} />)
    await user.click(screen.getByText("Pedro Ruiz"))
    await waitFor(() => screen.getByRole("button", { name: "Guardar" }))
    const input = screen.getByPlaceholderText("25.00")
    await user.clear(input)
    await user.type(input, "30.00")
    await user.click(screen.getByRole("button", { name: "Guardar" }))
    await waitFor(() => expect(mockToast.error).toHaveBeenCalled())
  })
})

// ─── Toggle solo mio ──────────────────────────────────────────────────────────

describe("CalendarView — toggle showOnlyMine", () => {
  it("llama a setShowOnlyMine al hacer clic en el botón Todas cuando canToggle=true", async () => {
    const setShowOnlyMine = jest.fn()
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      showOnlyMine: false,
      setShowOnlyMine,
    })
    const user = userEvent.setup()
    render(<CalendarView {...defaultProps} canToggle={true} />)
    await user.click(screen.getByRole("button", { name: /Todas/i }))
    expect(setShowOnlyMine).toHaveBeenCalled()
  })
})

// ─── Navegación mes → día ─────────────────────────────────────────────────────

describe("CalendarView — handleDayClick en MonthView", () => {
  it("llama a setView('day') al hacer clic en un día del mes", async () => {
    const setView = jest.fn()
    mockUseCalendar.mockReturnValue({
      ...defaultHook,
      view: "month" as const,
      setView,
      currentDate: new Date("2025-05-15T00:00:00"),
      bookings: [],
    })
    const user = userEvent.setup()
    render(<CalendarView {...defaultProps} initialView="month" />)
    const dayButtons = screen.getAllByRole("button").filter((b) =>
      /^\d+$/.test(b.textContent?.trim() ?? "")
    )
    await user.click(dayButtons[0])
    expect(setView).toHaveBeenCalledWith("day")
  })
})
