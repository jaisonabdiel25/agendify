jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
  },
}))
jest.mock("@prisma/client", () => ({
  Prisma: {
    Decimal: class MockDecimal {
      private val: string
      constructor(val: string) { this.val = val }
      toString() { return this.val }
    },
  },
}))

import { PATCH } from "@/app/api/bookings/[id]/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockSession = {
  user: { id: "user-1", businessId: "biz-1", role: "OWNER", name: "Dueño", email: "owner@test.com" },
  expires: "2099-12-31",
}

const mockUpdatedBooking = {
  id: "booking-1",
  startTime: new Date("2025-01-20T09:00:00"),
  endTime: new Date("2025-01-20T10:00:00"),
  status: "CONFIRMED",
  notes: null,
  paidAmount: null,
  service: {
    id: "svc-1",
    name: "Corte",
    color: "#6366f1",
    durationMinutes: 60,
    price: { toString: () => "25.00" },
  },
  chair: {
    id: "chair-1",
    name: "Silla A",
    color: "#4f46e5",
    user: { id: "user-1", name: "Ana" },
  },
  customer: { id: "cust-1", name: "María", phone: null },
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/bookings/booking-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const mockParams = { params: Promise.resolve({ id: "booking-1" }) }

beforeEach(() => {
  jest.clearAllMocks()
})

describe("PATCH /api/bookings/[id]", () => {
  it("retorna 401 sin sesión autenticada", async () => {
    authMock.mockResolvedValue(null)

    const res = await PATCH(makeRequest({ status: "CONFIRMED" }), mockParams)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autorizado")
  })

  it("retorna 400 con body inválido (status fuera del enum)", async () => {
    authMock.mockResolvedValue(mockSession)

    const res = await PATCH(makeRequest({ status: "ESTADO_INVALIDO" }), mockParams)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Datos inválidos")
  })

  it("trata body JSON inválido como objeto vacío y retorna 404 si no existe", async () => {
    authMock.mockResolvedValue(mockSession)
    // JSON inválido → catch retorna {} → schema válido (campos opcionales) → updateMany
    jest.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 0 })

    const req = new Request("http://localhost/api/bookings/booking-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "esto no es json{{{",
    })
    const res = await PATCH(req, mockParams)
    expect(res.status).toBe(404)
  })

  it("retorna 404 cuando la reserva no pertenece al negocio", async () => {
    authMock.mockResolvedValue(mockSession)
    jest.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 0 })

    const res = await PATCH(makeRequest({ status: "CANCELLED" }), mockParams)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe("No encontrado")
  })

  it("retorna 200 y el booking actualizado con status", async () => {
    authMock.mockResolvedValue(mockSession)
    jest.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 })
    jest.mocked(prisma.booking.findUnique).mockResolvedValue(
      mockUpdatedBooking as unknown as Awaited<ReturnType<typeof prisma.booking.findUnique>>
    )

    const res = await PATCH(makeRequest({ status: "CONFIRMED" }), mockParams)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe("booking-1")
    expect(body.status).toBe("CONFIRMED")
    expect(body.service.price).toBe("25.00")
  })

  it("acepta paidAmount válido con 2 decimales", async () => {
    authMock.mockResolvedValue(mockSession)
    jest.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 })
    jest.mocked(prisma.booking.findUnique).mockResolvedValue({
      ...mockUpdatedBooking,
      paidAmount: { toString: () => "50.00" },
    } as unknown as Awaited<ReturnType<typeof prisma.booking.findUnique>>)

    const res = await PATCH(makeRequest({ paidAmount: "50.00" }), mockParams)
    expect(res.status).toBe(200)
  })

  it("rechaza paidAmount con formato inválido", async () => {
    authMock.mockResolvedValue(mockSession)

    const res = await PATCH(makeRequest({ paidAmount: "abc" }), mockParams)
    expect(res.status).toBe(400)
  })

  it("acepta paidAmount=null para limpiar el monto", async () => {
    authMock.mockResolvedValue(mockSession)
    jest.mocked(prisma.booking.updateMany).mockResolvedValue({ count: 1 })
    jest.mocked(prisma.booking.findUnique).mockResolvedValue(
      mockUpdatedBooking as unknown as Awaited<ReturnType<typeof prisma.booking.findUnique>>
    )

    const res = await PATCH(makeRequest({ paidAmount: null }), mockParams)
    expect(res.status).toBe(200)
  })
})
