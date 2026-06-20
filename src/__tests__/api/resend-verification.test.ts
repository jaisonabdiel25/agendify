jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock("crypto", () => ({
  randomInt: jest.fn(() => 837461),
}))

jest.mock("@/lib/mailer", () => ({
  isMailConfigured: jest.fn(() => true),
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
}))

import { POST } from "@/app/api/auth/resend-verification/route"
import { prisma } from "@/lib/prisma"
import { isMailConfigured, sendVerificationEmail } from "@/lib/mailer"

const inactiveUser = { id: "user-1", name: "Juan", isActive: false }
const activeUser = { id: "user-2", name: "Ana", isActive: true }

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/resend-verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(isMailConfigured as jest.Mock).mockReturnValue(true)
  ;(sendVerificationEmail as jest.Mock).mockResolvedValue(undefined)
  ;(prisma.user.update as jest.Mock).mockResolvedValue({})
})

describe("POST /api/auth/resend-verification — validación", () => {
  it("retorna 400 con body inválido", async () => {
    const req = new Request("http://localhost/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("retorna 400 con email inválido", async () => {
    const res = await POST(makeRequest({ email: "no-es-email" }))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/auth/resend-verification — usuario no encontrado o ya activo", () => {
  it("retorna 200 si el usuario no existe (respuesta genérica)", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest({ email: "noexiste@test.com" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })

  it("retorna 200 si el usuario ya está activo (respuesta genérica)", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser)
    const res = await POST(makeRequest({ email: "ana@test.com" }))
    expect(res.status).toBe(200)
    expect(prisma.user.update).not.toHaveBeenCalled()
  })
})

describe("POST /api/auth/resend-verification — reenvío exitoso", () => {
  beforeEach(() => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser)
  })

  it("retorna 200 con { ok: true }", async () => {
    const res = await POST(makeRequest({ email: "juan@test.com" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("genera un nuevo token y lo guarda en BD", async () => {
    await POST(makeRequest({ email: "juan@test.com" }))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          emailVerifyToken: expect.any(String),
          emailVerifyExpires: expect.any(Date),
        }),
      })
    )
  })

  it("envía el correo de verificación con name, email y code cuando SMTP está configurado", async () => {
    await POST(makeRequest({ email: "juan@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Juan",
        email: "juan@test.com",
        code: expect.any(String),
      })
    )
  })

  it("no envía correo si SMTP no está configurado", async () => {
    ;(isMailConfigured as jest.Mock).mockReturnValue(false)
    await POST(makeRequest({ email: "juan@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(sendVerificationEmail).not.toHaveBeenCalled()
  })

  it("retorna 200 aunque el envío de correo falle (fire-and-forget)", async () => {
    ;(sendVerificationEmail as jest.Mock).mockRejectedValue(new Error("SMTP error"))
    const res = await POST(makeRequest({ email: "juan@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(res.status).toBe(200)
  })
})

describe("POST /api/auth/resend-verification — error interno", () => {
  it("retorna 500 si prisma lanza excepción", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"))
    const res = await POST(makeRequest({ email: "juan@test.com" }))
    expect(res.status).toBe(500)
  })
})
