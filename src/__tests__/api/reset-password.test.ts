jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}))

import { POST } from "@/app/api/auth/reset-password/route"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const futureDate = new Date(Date.now() + 60 * 60 * 1000)
const pastDate = new Date(Date.now() - 60 * 60 * 1000)

const validUser = {
  id: "user-1",
  passwordResetToken: "123456",
  passwordResetExpires: futureDate,
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const validBody = { email: "ana@test.com", code: "123456", password: "nuevapass123" }

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.user.update as jest.Mock).mockResolvedValue({})
})

describe("POST /api/auth/reset-password — validación", () => {
  it("retorna 400 con body inválido", async () => {
    const req = new Request("http://localhost/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin email", async () => {
    const res = await POST(makeRequest({ code: "123456", password: "nuevapass123" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin código", async () => {
    const res = await POST(makeRequest({ email: "ana@test.com", password: "nuevapass123" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con código de longitud incorrecta", async () => {
    const res = await POST(makeRequest({ email: "ana@test.com", code: "123", password: "nuevapass123" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con contraseña menor a 8 caracteres", async () => {
    const res = await POST(makeRequest({ email: "ana@test.com", code: "123456", password: "corta" }))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/auth/reset-password — token inválido", () => {
  it("retorna 400 cuando el usuario no existe", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/inválido|expirado/i)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("retorna 400 cuando el código no coincide", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...validUser,
      passwordResetToken: "999999",
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("retorna 400 cuando el token está expirado", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...validUser,
      passwordResetExpires: pastDate,
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/inválido|expirado/i)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("retorna 400 cuando passwordResetExpires es null", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({
      ...validUser,
      passwordResetExpires: null,
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/auth/reset-password — restablecimiento exitoso", () => {
  beforeEach(() => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(validUser)
  })

  it("retorna 200 con { ok: true }", async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("hashea la contraseña con bcrypt y costo 12", async () => {
    await POST(makeRequest(validBody))
    expect(bcrypt.hash).toHaveBeenCalledWith("nuevapass123", 12)
  })

  it("actualiza la contraseña y limpia los campos de reset", async () => {
    await POST(makeRequest(validBody))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          passwordHash: "hashed_password",
          passwordResetToken: null,
          passwordResetExpires: null,
        }),
      })
    )
  })
})

describe("POST /api/auth/reset-password — error interno", () => {
  it("retorna 500 si prisma lanza excepción", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})
