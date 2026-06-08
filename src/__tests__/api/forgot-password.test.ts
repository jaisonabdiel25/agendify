jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock("crypto", () => ({
  randomInt: jest.fn(() => 483920),
}))

import { POST } from "@/app/api/auth/forgot-password/route"
import { prisma } from "@/lib/prisma"

const activeUser = { id: "user-1", name: "Ana", isActive: true }
const inactiveUser = { id: "user-2", name: "Juan", isActive: false }

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/forgot-password", {
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

describe("POST /api/auth/forgot-password — validación", () => {
  it("retorna 400 con body inválido", async () => {
    const req = new Request("http://localhost/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("retorna 400 con email malformado", async () => {
    const res = await POST(makeRequest({ email: "no-es-email" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin email", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/auth/forgot-password — respuesta genérica (no revela existencia)", () => {
  it("retorna 200 si el usuario no existe sin llamar update ni webhook", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest({ email: "noexiste@test.com" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(prisma.user.update).not.toHaveBeenCalled()
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("retorna 200 si el usuario está inactivo sin llamar update ni webhook", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser)
    const res = await POST(makeRequest({ email: "juan@test.com" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(prisma.user.update).not.toHaveBeenCalled()
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe("POST /api/auth/forgot-password — solicitud exitosa", () => {
  beforeEach(() => {
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(activeUser)
  })

  it("retorna 200 con { ok: true }", async () => {
    const res = await POST(makeRequest({ email: "ana@test.com" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("guarda el código y la fecha de expiración en BD", async () => {
    await POST(makeRequest({ email: "ana@test.com" }))
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: expect.objectContaining({
          passwordResetToken: expect.stringMatching(/^\d{6}$/),
          passwordResetExpires: expect.any(Date),
        }),
      })
    )
  })

  it("la fecha de expiración está en el futuro", async () => {
    const before = new Date()
    await POST(makeRequest({ email: "ana@test.com" }))
    const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0]
    expect(updateCall.data.passwordResetExpires.getTime()).toBeGreaterThan(before.getTime())
  })

  it("llama al webhook con name, email, code y type cuando N8N_PASSWORD_RESET_WEBHOOK_URL está configurado", async () => {
    process.env.N8N_PASSWORD_RESET_WEBHOOK_URL = "https://n8n.test/webhook/agendify-reset"
    await POST(makeRequest({ email: "ana@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.test/webhook/agendify-reset",
      expect.objectContaining({ method: "POST" })
    )
    const fetchBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(fetchBody.name).toBe("Ana")
    expect(fetchBody.email).toBe("ana@test.com")
    expect(fetchBody.code).toMatch(/^\d{6}$/)
    expect(fetchBody.type).toBe("password_reset")
    delete process.env.N8N_PASSWORD_RESET_WEBHOOK_URL
  })

  it("no llama al webhook si N8N_PASSWORD_RESET_WEBHOOK_URL no está configurado", async () => {
    delete process.env.N8N_PASSWORD_RESET_WEBHOOK_URL
    await POST(makeRequest({ email: "ana@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("retorna 200 aunque el webhook falle (fire-and-forget)", async () => {
    process.env.N8N_PASSWORD_RESET_WEBHOOK_URL = "https://n8n.test/webhook/agendify-reset"
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))
    const res = await POST(makeRequest({ email: "ana@test.com" }))
    await new Promise((r) => setTimeout(r, 0))
    expect(res.status).toBe(200)
    delete process.env.N8N_PASSWORD_RESET_WEBHOOK_URL
  })
})

describe("POST /api/auth/forgot-password — error interno", () => {
  it("retorna 500 si prisma lanza excepción", async () => {
    ;(prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"))
    const res = await POST(makeRequest({ email: "ana@test.com" }))
    expect(res.status).toBe(500)
  })
})
