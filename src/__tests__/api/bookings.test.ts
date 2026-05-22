jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findMany: jest.fn(),
    },
  },
}))

import { GET } from "@/app/api/bookings/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockSession = {
  user: { id: "user-1", businessId: "biz-1", role: "OWNER", name: "Dueño", email: "owner@test.com" },
  expires: "2099-12-31",
}

const mockPrismaBooking = {
  id: "booking-1",
  startTime: new Date("2025-01-20T09:00:00"),
  endTime: new Date("2025-01-20T10:00:00"),
  status: "CONFIRMED",
  notes: null,
  paidAmount: null,
  service: {
    id: "svc-1",
    name: "Corte de cabello",
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
  customer: { id: "cust-1", name: "María García", phone: "555-1234" },
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("GET /api/bookings", () => {
  it("retorna 401 sin sesión autenticada", async () => {
    authMock.mockResolvedValue(null)

    const req = new Request(
      "http://localhost/api/bookings?from=2025-01-20T00:00:00.000Z&to=2025-01-26T23:59:59.999Z"
    )
    const res = await GET(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autorizado")
  })

  it("retorna 401 cuando sesión no tiene businessId", async () => {
    authMock.mockResolvedValue({
      user: { id: "u1", name: "X", email: "x@x.com" },
      expires: "2099",
    })

    const req = new Request(
      "http://localhost/api/bookings?from=2025-01-20T00:00:00.000Z&to=2025-01-26T23:59:59.999Z"
    )
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("retorna 400 con parámetros de fecha inválidos", async () => {
    authMock.mockResolvedValue(mockSession)

    const req = new Request("http://localhost/api/bookings?from=fecha-invalida&to=otra-invalida")
    const res = await GET(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Parámetros inválidos")
  })

  it("retorna 400 cuando faltan parámetros from/to", async () => {
    authMock.mockResolvedValue(mockSession)

    const req = new Request("http://localhost/api/bookings")
    const res = await GET(req)

    expect(res.status).toBe(400)
  })

  it("retorna 200 con lista de reservas serializada", async () => {
    authMock.mockResolvedValue(mockSession)
    jest.mocked(prisma.booking.findMany).mockResolvedValue(
      [mockPrismaBooking] as unknown as Awaited<ReturnType<typeof prisma.booking.findMany>>
    )

    const req = new Request(
      "http://localhost/api/bookings?from=2025-01-20T00:00:00.000Z&to=2025-01-26T23:59:59.999Z"
    )
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(1)
    expect(body[0].id).toBe("booking-1")
    expect(typeof body[0].startTime).toBe("string")
    expect(body[0].service.price).toBe("25.00")
  })

  it("serializa startTime y endTime como ISO strings", async () => {
    authMock.mockResolvedValue(mockSession)
    jest.mocked(prisma.booking.findMany).mockResolvedValue(
      [mockPrismaBooking] as unknown as Awaited<ReturnType<typeof prisma.booking.findMany>>
    )

    const req = new Request(
      "http://localhost/api/bookings?from=2025-01-20T00:00:00.000Z&to=2025-01-26T23:59:59.999Z"
    )
    const res = await GET(req)
    const [booking] = await res.json()

    expect(booking.startTime).toBe(mockPrismaBooking.startTime.toISOString())
    expect(booking.endTime).toBe(mockPrismaBooking.endTime.toISOString())
  })

  it("filtra por businessId del usuario autenticado", async () => {
    authMock.mockResolvedValue(mockSession)
    jest.mocked(prisma.booking.findMany).mockResolvedValue([])

    const req = new Request(
      "http://localhost/api/bookings?from=2025-01-20T00:00:00.000Z&to=2025-01-26T23:59:59.999Z"
    )
    await GET(req)

    const callArgs = jest.mocked(prisma.booking.findMany).mock.calls[0][0]
    expect(callArgs?.where?.businessId).toBe("biz-1")
  })

  it("acepta parámetro onlyMine=true", async () => {
    authMock.mockResolvedValue(mockSession)
    jest.mocked(prisma.booking.findMany).mockResolvedValue([])

    const req = new Request(
      "http://localhost/api/bookings?from=2025-01-20T00:00:00.000Z&to=2025-01-26T23:59:59.999Z&onlyMine=true"
    )
    const res = await GET(req)

    expect(res.status).toBe(200)
    const callArgs = jest.mocked(prisma.booking.findMany).mock.calls[0][0]
    expect(callArgs?.where).toMatchObject({ chair: { userId: "user-1" } })
  })
})
