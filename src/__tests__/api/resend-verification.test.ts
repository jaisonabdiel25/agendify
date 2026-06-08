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

import { POST } from "@/app/api/auth/resend-verification/route"
import { prisma } from "@/lib/prisma"

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
  global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)
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

  it("llama al webhook con name, email y code cuando N8N_WEBHOOK_URL está configurado", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.test/webhook/agendify-register"
    await POST(makeRequest({ email: "juan@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.test/webhook/agendify-register",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("juan@test.com"),
      })
    )
    delete process.env.N8N_WEBHOOK_URL
  })

  it("el body del webhook contiene code (no verifyUrl)", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.test/webhook/agendify-register"
    await POST(makeRequest({ email: "juan@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    const fetchBody = JSON.parse(fetchCall[1].body)
    expect(fetchBody).toHaveProperty("code")
    expect(fetchBody).toHaveProperty("type", "resend")
    expect(fetchBody).not.toHaveProperty("verifyUrl")
    delete process.env.N8N_WEBHOOK_URL
  })

  it("no llama al webhook si N8N_WEBHOOK_URL no está configurado", async () => {
    delete process.env.N8N_WEBHOOK_URL
    await POST(makeRequest({ email: "juan@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("retorna 200 aunque el webhook falle (fire-and-forget)", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.test/webhook/agendify-register"
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))
    const res = await POST(makeRequest({ email: "juan@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(res.status).toBe(200)
    delete process.env.N8N_WEBHOOK_URL
  })
})

describe("POST /api/auth/resend-verification — error interno", () => {
  it("retorna 500 si prisma lanza excepción", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"))
    const res = await POST(makeRequest({ email: "juan@test.com" }))
    expect(res.status).toBe(500)
  })
})
