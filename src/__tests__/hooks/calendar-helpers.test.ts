import {
  getDateRange,
  navigateDate,
  getEventPosition,
  resolveOverlaps,
  buildTimeSlots,
  GRID_START_HOUR,
  SLOT_HEIGHT_PX,
} from "@/hooks/use-calendar"
import type { BookingEvent } from "@/types/calendar"

// Lunes 20 de enero de 2025 (fecha fija para tests de calendario)
const MONDAY = new Date(2025, 0, 20)

function mkEvent(
  localStart: string,
  localEnd: string,
  id = "e1",
  chairId = "c1"
): BookingEvent {
  return {
    id,
    startTime: localStart,
    endTime: localEnd,
    status: "CONFIRMED",
    notes: null,
    paidAmount: null,
    service: {
      id: "s1",
      name: "Corte",
      color: "#6366f1",
      durationMinutes: 60,
      price: "25.00",
    },
    chair: {
      id: chairId,
      name: "Silla A",
      color: "#4f46e5",
      user: { id: "u1", name: "Ana" },
    },
    customer: { id: "cu1", name: "Cliente", phone: null },
  }
}

// ──────────────────────────────────────────────────────────
// getDateRange
// ──────────────────────────────────────────────────────────
describe("getDateRange", () => {
  it("week: inicia el lunes y termina el domingo de esa semana", () => {
    const { from, to } = getDateRange(MONDAY, "week")
    expect(from.getDate()).toBe(20) // lunes 20 ene
    expect(to.getDate()).toBe(26)   // domingo 26 ene
    expect(from.getDay()).toBe(1)   // Monday = 1
    expect(to.getDay()).toBe(0)     // Sunday = 0
  })

  it("day: cubre solo el día completo", () => {
    const { from, to } = getDateRange(MONDAY, "day")
    expect(from.getDate()).toBe(20)
    expect(to.getDate()).toBe(20)
    expect(from.getHours()).toBe(0)
    expect(to.getHours()).toBe(23)
  })

  it("chairs: igual que day (mismo día)", () => {
    const { from, to } = getDateRange(MONDAY, "chairs")
    expect(from.getDate()).toBe(20)
    expect(to.getDate()).toBe(20)
    expect(from.getHours()).toBe(0)
    expect(to.getHours()).toBe(23)
  })

  it("month: cubre el mes completo (enero: días 1-31)", () => {
    const { from, to } = getDateRange(MONDAY, "month")
    expect(from.getDate()).toBe(1)
    expect(to.getDate()).toBe(31)
    expect(from.getMonth()).toBe(0)
    expect(to.getMonth()).toBe(0)
  })
})

// ──────────────────────────────────────────────────────────
// navigateDate
// ──────────────────────────────────────────────────────────
describe("navigateDate", () => {
  it("week +1 avanza 7 días", () => {
    const next = navigateDate(MONDAY, "week", 1)
    expect(next.getDate()).toBe(27)
  })

  it("week -1 retrocede 7 días", () => {
    const prev = navigateDate(MONDAY, "week", -1)
    expect(prev.getDate()).toBe(13)
  })

  it("day +1 avanza 1 día", () => {
    const next = navigateDate(MONDAY, "day", 1)
    expect(next.getDate()).toBe(21)
  })

  it("day -1 retrocede 1 día", () => {
    const prev = navigateDate(MONDAY, "day", -1)
    expect(prev.getDate()).toBe(19)
  })

  it("chairs +1 avanza 1 día", () => {
    const next = navigateDate(MONDAY, "chairs", 1)
    expect(next.getDate()).toBe(21)
  })

  it("month +1 avanza al siguiente mes", () => {
    const next = navigateDate(MONDAY, "month", 1)
    expect(next.getMonth()).toBe(1) // febrero
    expect(next.getFullYear()).toBe(2025)
  })

  it("month -1 retrocede al mes anterior", () => {
    const prev = navigateDate(MONDAY, "month", -1)
    expect(prev.getMonth()).toBe(11) // diciembre
    expect(prev.getFullYear()).toBe(2024)
  })
})

// ──────────────────────────────────────────────────────────
// getEventPosition
// ──────────────────────────────────────────────────────────
describe("getEventPosition", () => {
  it("evento a las 8:00 tiene top=0 (inicio de grilla)", () => {
    const { top } = getEventPosition(mkEvent("2025-01-20T08:00:00", "2025-01-20T09:00:00"))
    expect(top).toBe(0)
  })

  it("evento de 60 min tiene height=128px (2 slots)", () => {
    const { height } = getEventPosition(mkEvent("2025-01-20T08:00:00", "2025-01-20T09:00:00"))
    expect(height).toBe(128)
  })

  it("evento a las 8:30 tiene top=64 (1 slot después del inicio)", () => {
    const { top } = getEventPosition(mkEvent("2025-01-20T08:30:00", "2025-01-20T09:00:00"))
    expect(top).toBe(SLOT_HEIGHT_PX)
  })

  it("evento a las 9:00 tiene top=128 (2 slots desde inicio)", () => {
    const { top } = getEventPosition(mkEvent("2025-01-20T09:00:00", "2025-01-20T10:00:00"))
    expect(top).toBe(SLOT_HEIGHT_PX * 2)
  })

  it("evento muy corto (<30 min) tiene altura mínima de SLOT_HEIGHT/2", () => {
    const { height } = getEventPosition(mkEvent("2025-01-20T08:00:00", "2025-01-20T08:10:00"))
    expect(height).toBe(SLOT_HEIGHT_PX / 2)
  })

  it("evento de 30 min tiene height=64 (exactamente 1 slot)", () => {
    const { height } = getEventPosition(mkEvent("2025-01-20T08:00:00", "2025-01-20T08:30:00"))
    expect(height).toBe(SLOT_HEIGHT_PX)
  })

  it("grilla empieza en hora " + GRID_START_HOUR, () => {
    // Evento 1h antes del inicio de grilla → offset negativo (no representable pero calculable)
    const { top } = getEventPosition(mkEvent("2025-01-20T07:00:00", "2025-01-20T08:00:00"))
    expect(top).toBe(-SLOT_HEIGHT_PX * 2) // -2 slots
  })
})

// ──────────────────────────────────────────────────────────
// resolveOverlaps
// ──────────────────────────────────────────────────────────
describe("resolveOverlaps", () => {
  it("sin eventos retorna array vacío", () => {
    expect(resolveOverlaps([])).toEqual([])
  })

  it("evento único tiene column=0 y totalColumns=1", () => {
    const [ev] = resolveOverlaps([mkEvent("2025-01-20T08:00:00", "2025-01-20T09:00:00")])
    expect(ev.column).toBe(0)
    expect(ev.totalColumns).toBe(1)
  })

  it("dos eventos sin solapamiento mantienen column=0 y totalColumns=1", () => {
    const events = [
      mkEvent("2025-01-20T08:00:00", "2025-01-20T09:00:00", "e1"),
      mkEvent("2025-01-20T10:00:00", "2025-01-20T11:00:00", "e2"),
    ]
    const result = resolveOverlaps(events)
    expect(result[0].column).toBe(0)
    expect(result[0].totalColumns).toBe(1)
    expect(result[1].column).toBe(0)
    expect(result[1].totalColumns).toBe(1)
  })

  it("dos eventos solapados tienen totalColumns=2", () => {
    const events = [
      mkEvent("2025-01-20T08:00:00", "2025-01-20T09:00:00", "e1"),
      mkEvent("2025-01-20T08:30:00", "2025-01-20T09:30:00", "e2"),
    ]
    const result = resolveOverlaps(events)
    // El primer evento (ordenado por inicio) recibe column=0
    const first = result.find((e) => e.id === "e1")!
    expect(first.totalColumns).toBe(2)
    expect(first.column).toBe(0)
  })

  it("ordena los eventos por hora de inicio", () => {
    const events = [
      mkEvent("2025-01-20T10:00:00", "2025-01-20T11:00:00", "tarde"),
      mkEvent("2025-01-20T08:00:00", "2025-01-20T09:00:00", "temprano"),
    ]
    const result = resolveOverlaps(events)
    expect(result[0].id).toBe("temprano")
    expect(result[1].id).toBe("tarde")
  })

  it("incluye top y height calculados en cada evento", () => {
    const [ev] = resolveOverlaps([mkEvent("2025-01-20T08:00:00", "2025-01-20T09:00:00")])
    expect(ev.top).toBe(0)
    expect(ev.height).toBe(128)
  })
})

// ──────────────────────────────────────────────────────────
// buildTimeSlots
// ──────────────────────────────────────────────────────────
describe("buildTimeSlots", () => {
  it("genera 28 slots (14 horas × 2 slots/hora)", () => {
    expect(buildTimeSlots()).toHaveLength(28)
  })

  it("el primer slot es '08:00'", () => {
    expect(buildTimeSlots()[0]).toBe("08:00")
  })

  it("el segundo slot es '08:30'", () => {
    expect(buildTimeSlots()[1]).toBe("08:30")
  })

  it("el último slot es '21:30'", () => {
    const slots = buildTimeSlots()
    expect(slots[slots.length - 1]).toBe("21:30")
  })

  it("todos los slots tienen formato HH:MM", () => {
    const timeRegex = /^\d{2}:\d{2}$/
    buildTimeSlots().forEach((slot) => {
      expect(slot).toMatch(timeRegex)
    })
  })
})
