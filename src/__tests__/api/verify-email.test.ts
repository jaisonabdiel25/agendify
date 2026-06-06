jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { POST } from "@/app/api/auth/verify-email/route"
import { prisma } from "@/lib/prisma"

const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
const pastDate = new Date(Date.now() - 1000)

const validUser = {
  id: "user-1",
  emailVerifyExpires: futureDate,
  pendingBusinessId: "biz-1",
}

function makeRequest(email?: string, code?: string) {
  const body = email !== undefined && code !== undefined
    ? { email, code }
    : email !== undefined
    ? { email }
    : {}
  return new Request("http://localhost/api/auth/verify-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.user.update as jest.Mock).mockResolvedValue({})
})

describe("POST /api/auth/verify-email — validación de datos", () => {
  it("retorna 400 sin body", async () => {
    const req = new Request("http://localhost/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/inválidos/i)
  })

  it("retorna 400 sin email", async () => {
    const res = await POST(makeRequest(undefined))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con email inválido", async () => {
    const res = await POST(makeRequest("no-es-email", "123456"))
    expect(res.status).toBe(400)
  })

  it("retorna 400 si el código no tiene 6 dígitos", async () => {
    const res = await POST(makeRequest("juan@test.com", "12345"))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/auth/verify-email — validación de código", () => {
  it("retorna 400 con código incorrecto (usuario no encontrado)", async () => {
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest("juan@test.com", "000000"))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/inválido/i)
  })

  it("retorna 410 con código expirado", async () => {
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({
      ...validUser,
      emailVerifyExpires: pastDate,
    })
    const res = await POST(makeRequest("juan@test.com", "483920"))
    expect(res.status).toBe(410)
    const body = await res.json()
    expect(body.error).toMatch(/expirado/i)
  })
})

describe("POST /api/auth/verify-email — verificación exitosa", () => {
  beforeEach(() => {
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(validUser)
  })

  it("actualiza isActive a true", async () => {
    await POST(makeRequest("juan@test.com", "483920"))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: true }),
      })
    )
  })

  it("asigna businessId desde pendingBusinessId", async () => {
    await POST(makeRequest("juan@test.com", "483920"))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ businessId: "biz-1" }),
      })
    )
  })

  it("limpia pendingBusinessId a null", async () => {
    await POST(makeRequest("juan@test.com", "483920"))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pendingBusinessId: null }),
      })
    )
  })

  it("limpia emailVerifyToken a null", async () => {
    await POST(makeRequest("juan@test.com", "483920"))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emailVerifyToken: null }),
      })
    )
  })

  it("limpia emailVerifyExpires a null", async () => {
    await POST(makeRequest("juan@test.com", "483920"))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ emailVerifyExpires: null }),
      })
    )
  })

  it("actualiza el usuario correcto por id", async () => {
    await POST(makeRequest("juan@test.com", "483920"))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
      })
    )
  })

  it("retorna { ok: true } en éxito", async () => {
    const res = await POST(makeRequest("juan@test.com", "483920"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })
})

describe("POST /api/auth/verify-email — error interno", () => {
  it("retorna 500 si prisma lanza excepción", async () => {
    ;(prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error("DB error"))
    const res = await POST(makeRequest("juan@test.com", "483920"))
    expect(res.status).toBe(500)
  })
})
