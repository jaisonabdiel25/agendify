jest.mock("@/lib/prisma", () => ({
  prisma: {
    chairSchedule: { findUnique: jest.fn() },
    service: { findUnique: jest.fn() },
    booking: { findMany: jest.fn() },
  },
}))

import { GET } from "@/app/api/public/availability/route"
import { prisma } from "@/lib/prisma"

const baseSchedule = {
  chairId: "c1",
  dayOfWeek: 1,
  isActive: true,
  openTime: "09:00",
  closeTime: "10:00",
}

const baseService = { durationMinutes: 30 }

beforeEach(() => {
  jest.clearAllMocks()
})

function makeRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/public/availability")
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url.toString())
}

describe("GET /api/public/availability — parámetros requeridos", () => {
  it("retorna 400 sin chairId", async () => {
    const res = await GET(makeRequest({ serviceId: "s1", date: "2025-06-02" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin serviceId", async () => {
    const res = await GET(makeRequest({ chairId: "c1", date: "2025-06-02" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin date", async () => {
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1" }))
    expect(res.status).toBe(400)
  })
})

describe("GET /api/public/availability — sin horario disponible", () => {
  it("retorna array vacío si no hay horario configurado para ese día", async () => {
    ;(prisma.chairSchedule.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(baseService)
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1", date: "2025-06-02" }))
    const body = await res.json()
    expect(body).toEqual([])
  })

  it("retorna array vacío si el horario está inactivo", async () => {
    ;(prisma.chairSchedule.findUnique as jest.Mock).mockResolvedValue({
      ...baseSchedule,
      isActive: false,
    })
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(baseService)
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1", date: "2025-06-02" }))
    const body = await res.json()
    expect(body).toEqual([])
  })

  it("retorna array vacío si el servicio no existe", async () => {
    ;(prisma.chairSchedule.findUnique as jest.Mock).mockResolvedValue(baseSchedule)
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1", date: "2025-06-02" }))
    const body = await res.json()
    expect(body).toEqual([])
  })

  it("retorna array vacío cuando la duración es mayor al horario disponible", async () => {
    ;(prisma.chairSchedule.findUnique as jest.Mock).mockResolvedValue({
      ...baseSchedule,
      openTime: "09:00",
      closeTime: "09:15",
    })
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue({ durationMinutes: 30 })
    ;(prisma.booking.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1", date: "2025-06-02" }))
    const body = await res.json()
    expect(body).toEqual([])
  })
})

describe("GET /api/public/availability — slots disponibles", () => {
  it("retorna los slots sin reservas previas (ventana 1h, servicio 30min → 2 slots)", async () => {
    ;(prisma.chairSchedule.findUnique as jest.Mock).mockResolvedValue(baseSchedule)
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue({ durationMinutes: 30 })
    ;(prisma.booking.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1", date: "2025-06-02" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(["09:00", "09:30"])
  })

  it("excluye slots que se solapan con reservas existentes", async () => {
    ;(prisma.chairSchedule.findUnique as jest.Mock).mockResolvedValue(baseSchedule)
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue({ durationMinutes: 30 })
    ;(prisma.booking.findMany as jest.Mock).mockResolvedValue([
      {
        startTime: new Date(2025, 5, 2, 9, 0),
        endTime: new Date(2025, 5, 2, 9, 30),
      },
    ])
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1", date: "2025-06-02" }))
    const body = await res.json()
    expect(body).not.toContain("09:00")
    expect(body).toContain("09:30")
  })

  it("excluye slots con solapamiento parcial de reserva", async () => {
    ;(prisma.chairSchedule.findUnique as jest.Mock).mockResolvedValue({
      ...baseSchedule,
      openTime: "09:00",
      closeTime: "11:00",
    })
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue({ durationMinutes: 30 })
    ;(prisma.booking.findMany as jest.Mock).mockResolvedValue([
      {
        startTime: new Date(2025, 5, 2, 9, 15),
        endTime: new Date(2025, 5, 2, 9, 45),
      },
    ])
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1", date: "2025-06-02" }))
    const body = await res.json()
    expect(body).not.toContain("09:00")
    expect(body).not.toContain("09:30")
    expect(body).toContain("10:00")
  })

  it("el slot avanza de 30 en 30 minutos", async () => {
    ;(prisma.chairSchedule.findUnique as jest.Mock).mockResolvedValue({
      ...baseSchedule,
      openTime: "09:00",
      closeTime: "11:00",
    })
    ;(prisma.service.findUnique as jest.Mock).mockResolvedValue({ durationMinutes: 30 })
    ;(prisma.booking.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(makeRequest({ chairId: "c1", serviceId: "s1", date: "2025-06-02" }))
    const body = await res.json()
    expect(body).toEqual(["09:00", "09:30", "10:00", "10:30"])
  })
})
