jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    chair: { findFirst: jest.fn() },
    chairSchedule: { upsert: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { GET, PUT } from "@/app/api/schedule/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockSession = {
  user: { id: "user-1", businessId: "biz-1", role: "STAFF" },
  expires: "2099-12-31",
}

const mockChair = {
  id: "chair-1",
  name: "Silla A",
  schedules: [
    { dayOfWeek: 0, isActive: false, openTime: "09:00", closeTime: "18:00" },
    { dayOfWeek: 1, isActive: true, openTime: "09:00", closeTime: "18:00" },
  ],
}

const validSchedules = Array.from({ length: 7 }, (_, i) => ({
  dayOfWeek: i,
  isActive: i >= 1 && i <= 5,
  openTime: "09:00",
  closeTime: "18:00",
}))

beforeEach(() => {
  jest.clearAllMocks()
})

function makePutRequest(body: unknown) {
  return new Request("http://localhost/api/schedule", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/schedule — autenticación", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })
})

describe("GET /api/schedule — lógica", () => {
  it("retorna 404 si el usuario no tiene puesto asignado", async () => {
    authMock.mockResolvedValue(mockSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/puesto asignado/i)
  })

  it("retorna 200 con el puesto y sus horarios", async () => {
    authMock.mockResolvedValue(mockSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(mockChair)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe("chair-1")
    expect(body.schedules).toHaveLength(2)
  })

  it("busca el puesto por userId y businessId de la sesión", async () => {
    authMock.mockResolvedValue(mockSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(mockChair)
    await GET()
    expect(prisma.chair.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: "user-1", businessId: "biz-1" }),
      })
    )
  })
})

// ─── PUT ──────────────────────────────────────────────────────────────────────

describe("PUT /api/schedule — autenticación", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await PUT(makePutRequest({ schedules: validSchedules }))
    expect(res.status).toBe(401)
  })
})

describe("PUT /api/schedule — validación", () => {
  beforeEach(() => authMock.mockResolvedValue(mockSession))

  it("retorna 400 con body no JSON", async () => {
    const req = new Request("http://localhost/api/schedule", {
      method: "PUT",
      body: "no-json",
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it("retorna 400 con array de horarios incompleto (menos de 7)", async () => {
    const res = await PUT(makePutRequest({ schedules: validSchedules.slice(0, 5) }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con formato de hora inválido", async () => {
    const invalid = validSchedules.map((s, i) =>
      i === 0 ? { ...s, openTime: "9:00" } : s
    )
    const res = await PUT(makePutRequest({ schedules: invalid }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con dayOfWeek fuera de rango", async () => {
    const invalid = [{ dayOfWeek: 7, isActive: false, openTime: "09:00", closeTime: "18:00" }]
    const res = await PUT(makePutRequest({ schedules: invalid }))
    expect(res.status).toBe(400)
  })
})

describe("PUT /api/schedule — lógica", () => {
  beforeEach(() => authMock.mockResolvedValue(mockSession))

  it("retorna 404 si el usuario no tiene puesto asignado", async () => {
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await PUT(makePutRequest({ schedules: validSchedules }))
    expect(res.status).toBe(404)
  })

  it("retorna 200 con { ok: true } al guardar exitosamente", async () => {
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue({ id: "chair-1", name: "Silla A" })
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([])
    const res = await PUT(makePutRequest({ schedules: validSchedules }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("ejecuta una transacción con 7 upserts (uno por día)", async () => {
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue({ id: "chair-1", name: "Silla A" })
    ;(prisma.$transaction as jest.Mock).mockResolvedValue([])
    await PUT(makePutRequest({ schedules: validSchedules }))
    const txCall = (prisma.$transaction as jest.Mock).mock.calls[0][0]
    expect(txCall).toHaveLength(7)
  })
})
