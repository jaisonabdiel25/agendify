/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react"
import { useCalendar } from "@/hooks/use-calendar"
import type { BookingEvent, Chair } from "@/types/calendar"

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockChairs: Chair[] = [{ id: "c1", name: "Silla A", avatarUrl: null }]

// 2025-01-20 es lunes → semana completa dentro de enero (mismo mes)
const BASE_DATE = "2025-01-20T12:00:00.000Z"

const mockBooking: BookingEvent = {
  id: "b1",
  startTime: "2025-01-20T09:00:00.000Z",
  endTime: "2025-01-20T10:00:00.000Z",
  status: "CONFIRMED",
  notes: null,
  paidAmount: null,
  service: { id: "s1", name: "Corte", color: "#6366f1", durationMinutes: 60, price: "25.00" },
  chair: { id: "c1", name: "Silla A", color: "#4f46e5", user: { id: "u1", name: "Ana" } },
  customer: { id: "cust1", name: "María", phone: null },
}

function makeOptions(overrides: Partial<Parameters<typeof useCalendar>[0]> = {}): Parameters<typeof useCalendar>[0] {
  return {
    initialView: "week",
    initialDate: BASE_DATE,
    initialBookings: [],
    initialChairs: [],
    initialShowOnlyMine: false,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── inicialización ────────────────────────────────────────────────────────────

describe("useCalendar — inicialización", () => {
  it("expone los valores correctos tras el primer render", () => {
    const { result } = renderHook(() =>
      useCalendar(makeOptions({ initialBookings: [mockBooking], initialChairs: mockChairs }))
    )

    expect(result.current.view).toBe("week")
    expect(result.current.bookings).toHaveLength(1)
    expect(result.current.chairs).toHaveLength(1)
    expect(result.current.showOnlyMine).toBe(false)
    expect(result.current.weekDays).toHaveLength(7)
    expect(result.current.timeSlots.length).toBeGreaterThan(0)
    expect(result.current.GRID_START_HOUR).toBe(8)
    expect(result.current.GRID_END_HOUR).toBe(22)
    expect(result.current.SLOT_HEIGHT_PX).toBe(64)
  })

  it("no llama a fetch en la carga inicial (rango ya está cargado)", () => {
    renderHook(() => useCalendar(makeOptions()))
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

// ─── navegación ───────────────────────────────────────────────────────────────

describe("useCalendar — navegación", () => {
  beforeEach(() => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve([]) })
  })

  it("goToNext avanza la fecha", async () => {
    const { result } = renderHook(() => useCalendar(makeOptions()))
    const before = result.current.currentDate.getTime()

    act(() => { result.current.goToNext() })

    await waitFor(() => {
      expect(result.current.currentDate.getTime()).toBeGreaterThan(before)
    })
  })

  it("goToPrev retrocede la fecha", async () => {
    const { result } = renderHook(() => useCalendar(makeOptions()))
    const before = result.current.currentDate.getTime()

    act(() => { result.current.goToPrev() })

    await waitFor(() => {
      expect(result.current.currentDate.getTime()).toBeLessThan(before)
    })
  })

  it("goToToday setea la fecha a hoy", () => {
    const { result } = renderHook(() =>
      useCalendar(makeOptions({ initialDate: "2020-01-01T00:00:00.000Z" }))
    )
    const before = Date.now()

    act(() => { result.current.goToToday() })

    expect(result.current.currentDate.getTime()).toBeGreaterThanOrEqual(before)
  })

  it("goToDate navega a la fecha indicada", () => {
    const { result } = renderHook(() => useCalendar(makeOptions({ initialView: "day" })))
    const target = new Date("2025-03-15T12:00:00.000Z")

    act(() => { result.current.goToDate(target) })

    expect(result.current.currentDate).toEqual(target)
  })

  it("setView cambia la vista activa", async () => {
    const { result } = renderHook(() => useCalendar(makeOptions()))

    act(() => { result.current.setView("month") })

    expect(result.current.view).toBe("month")
  })
})

// ─── useEffect — fetch ────────────────────────────────────────────────────────

describe("useCalendar — fetch al cambiar rango", () => {
  it("llama a fetch cuando la fecha cambia a un nuevo rango", async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve([]) })

    const { result } = renderHook(() => useCalendar(makeOptions()))

    act(() => { result.current.goToNext() })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain("/api/bookings")
    expect(url).toContain("from=")
    expect(url).toContain("to=")
    expect(url).not.toContain("onlyMine")
  })

  it("incluye onlyMine=true cuando showOnlyMine cambia a true", async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve([]) })

    const { result } = renderHook(() => useCalendar(makeOptions()))

    act(() => { result.current.setShowOnlyMine(true) })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1))

    const url: string = mockFetch.mock.calls[0][0]
    expect(url).toContain("onlyMine=true")
  })

  it("actualiza bookings con los datos devueltos por el fetch", async () => {
    mockFetch.mockResolvedValue({ json: () => Promise.resolve([mockBooking]) })

    const { result } = renderHook(() => useCalendar(makeOptions()))

    act(() => { result.current.goToNext() })

    await waitFor(() => {
      expect(result.current.bookings).toHaveLength(1)
      expect(result.current.bookings[0].id).toBe("b1")
    })
  })
})

// ─── updateBooking ────────────────────────────────────────────────────────────

describe("useCalendar — updateBooking", () => {
  it("actualiza el booking con el id indicado", () => {
    const { result } = renderHook(() =>
      useCalendar(makeOptions({ initialBookings: [mockBooking] }))
    )

    act(() => { result.current.updateBooking("b1", { status: "CANCELLED" }) })

    expect(result.current.bookings[0].status).toBe("CANCELLED")
  })

  it("no modifica bookings con id diferente", () => {
    const b2: BookingEvent = {
      ...mockBooking,
      id: "b2",
      startTime: "2025-01-20T11:00:00.000Z",
      endTime: "2025-01-20T12:00:00.000Z",
    }

    const { result } = renderHook(() =>
      useCalendar(makeOptions({ initialBookings: [mockBooking, b2] }))
    )

    act(() => { result.current.updateBooking("b1", { status: "CANCELLED" }) })

    expect(result.current.bookings[0].status).toBe("CANCELLED")
    expect(result.current.bookings[1].status).toBe("CONFIRMED")
  })
})

// ─── bookingsForDay y bookingsForChair ────────────────────────────────────────

describe("useCalendar — bookingsForDay", () => {
  // El booking tiene startTime "2025-01-20T09:00:00.000Z".
  // isSameDay compara en hora local, así que usamos constructores locales
  // para evitar que el UTC offset cambie el día en distintos entornos.
  const localJan20 = new Date(2025, 0, 20) // medianoche local 20 ene
  const localJan21 = new Date(2025, 0, 21) // medianoche local 21 ene

  // Booking con hora de inicio al mediodía local → siempre día 20 sin importar la zona
  const bookingLocalNoon: BookingEvent = {
    ...mockBooking,
    startTime: new Date(2025, 0, 20, 12, 0, 0).toISOString(),
    endTime: new Date(2025, 0, 20, 13, 0, 0).toISOString(),
  }

  it("retorna reservas del día indicado", () => {
    const { result } = renderHook(() =>
      useCalendar(makeOptions({ initialBookings: [bookingLocalNoon] }))
    )

    const found = result.current.bookingsForDay(localJan20)
    expect(found).toHaveLength(1)
    expect(found[0].id).toBe("b1")
  })

  it("retorna vacío para un día sin reservas", () => {
    const { result } = renderHook(() =>
      useCalendar(makeOptions({ initialBookings: [bookingLocalNoon] }))
    )

    expect(result.current.bookingsForDay(localJan21)).toHaveLength(0)
  })
})

describe("useCalendar — bookingsForChair", () => {
  // Usamos noon local para que isSameDay coincida con la fecha de currentDate (también mediodía)
  const bookingLocalNoon: BookingEvent = {
    ...mockBooking,
    startTime: new Date(2025, 0, 20, 12, 0, 0).toISOString(),
    endTime: new Date(2025, 0, 20, 13, 0, 0).toISOString(),
  }
  // initialDate en el mismo momento para que currentDate sea el 20 local
  const localNoonISO = new Date(2025, 0, 20, 12, 0, 0).toISOString()

  it("retorna reservas de la silla en la fecha actual", () => {
    const { result } = renderHook(() =>
      useCalendar(
        makeOptions({
          initialView: "day",
          initialDate: localNoonISO,
          initialBookings: [bookingLocalNoon],
          initialChairs: mockChairs,
        })
      )
    )

    const found = result.current.bookingsForChair("c1")
    expect(found).toHaveLength(1)
    expect(found[0].id).toBe("b1")
  })

  it("retorna vacío para una silla sin reservas en la fecha actual", () => {
    const { result } = renderHook(() =>
      useCalendar(
        makeOptions({
          initialView: "day",
          initialDate: localNoonISO,
          initialBookings: [bookingLocalNoon],
          initialChairs: mockChairs,
        })
      )
    )

    expect(result.current.bookingsForChair("otro-id")).toHaveLength(0)
  })
})

// ─── rangeLabel ───────────────────────────────────────────────────────────────

describe("useCalendar — rangeLabel", () => {
  it("vista week con inicio y fin en el mismo mes", () => {
    // 2025-01-20 (lun) → semana 20–26 enero: mismo mes
    const { result } = renderHook(() => useCalendar(makeOptions({ initialView: "week" })))
    expect(result.current.rangeLabel).toMatch(/–/)
    expect(result.current.rangeLabel).toMatch(/2025/)
  })

  it("vista week con inicio y fin en meses distintos", () => {
    // 2025-01-27 (lun) → semana 27 ene – 2 feb: meses distintos
    const { result } = renderHook(() =>
      useCalendar(makeOptions({ initialView: "week", initialDate: "2025-01-27T12:00:00.000Z" }))
    )
    expect(result.current.rangeLabel).toMatch(/–/)
    expect(result.current.rangeLabel).toMatch(/2025/)
  })

  it("vista day incluye la fecha completa", () => {
    const { result } = renderHook(() => useCalendar(makeOptions({ initialView: "day" })))
    expect(result.current.rangeLabel).toMatch(/2025/)
  })

  it("vista chairs incluye la fecha completa", () => {
    const { result } = renderHook(() => useCalendar(makeOptions({ initialView: "chairs" })))
    expect(result.current.rangeLabel).toMatch(/2025/)
  })

  it("vista month incluye mes y año", () => {
    const { result } = renderHook(() => useCalendar(makeOptions({ initialView: "month" })))
    expect(result.current.rangeLabel).toMatch(/2025/)
  })
})
