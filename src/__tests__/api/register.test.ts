jest.mock("@/lib/prisma", () => ({
  prisma: {
    invitation: { findUnique: jest.fn() },
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed_password"),
}))

jest.mock("crypto", () => ({
  randomInt: jest.fn(() => 483920),
}))

import { POST } from "@/app/api/auth/register/route"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const txMock = {
  user: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  invitation: {
    update: jest.fn(),
  },
}

const mockInvitation = {
  id: "inv-1",
  code: "VALID_CODE",
  businessId: "biz-1",
  usedAt: null,
}

const validBody = {
  invitationCode: "VALID_CODE",
  name: "Juan Pérez",
  email: "juan@ejemplo.com",
  password: "contraseña123",
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)
  ;(prisma.$transaction as jest.Mock).mockImplementation(
    async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock)
  )
  txMock.user.findFirst.mockResolvedValue(null)
  txMock.user.create.mockResolvedValue({})
  txMock.invitation.update.mockResolvedValue({})
})

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/auth/register — validación de datos", () => {
  it("retorna 400 cuando el body está vacío", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con email inválido", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "no-es-email" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con contraseña menor a 8 caracteres", async () => {
    const res = await POST(makeRequest({ ...validBody, password: "corta7" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con nombre de 1 carácter", async () => {
    const res = await POST(makeRequest({ ...validBody, name: "J" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin código de invitación", async () => {
    const { invitationCode: _omit, ...withoutCode } = validBody
    const res = await POST(makeRequest(withoutCode))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/auth/register — validación de invitación", () => {
  it("retorna 404 cuando el código de invitación no existe", async () => {
    ;(prisma.invitation.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/inválido/i)
  })

  it("retorna 409 cuando el código ya fue utilizado", async () => {
    ;(prisma.invitation.findUnique as jest.Mock).mockResolvedValue({
      ...mockInvitation,
      usedAt: new Date("2025-01-01"),
    })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/ya fue utilizado/i)
  })
})

describe("POST /api/auth/register — email duplicado", () => {
  it("retorna 409 cuando el email ya está registrado", async () => {
    ;(prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "existing-user" })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/ya está registrado/i)
  })
})

describe("POST /api/auth/register — registro exitoso", () => {
  beforeEach(() => {
    ;(prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
  })

  it("retorna 201 con { ok: true }", async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("retorna mensaje indicando revisar el correo", async () => {
    const res = await POST(makeRequest(validBody))
    const body = await res.json()
    expect(body.message).toMatch(/correo/i)
  })

  it("crea el primer usuario del negocio con rol OWNER", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "OWNER" }),
      })
    )
  })

  it("crea usuarios posteriores con rol STAFF cuando ya existe un usuario del negocio", async () => {
    txMock.user.findFirst.mockResolvedValue({ id: "owner-existente" })
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "STAFF" }),
      })
    )
  })

  it("crea el usuario con isActive: false", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isActive: false }),
      })
    )
  })

  it("crea el usuario con businessId: null", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ businessId: null }),
      })
    )
  })

  it("crea el usuario con pendingBusinessId del negocio de la invitación", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ pendingBusinessId: "biz-1" }),
      })
    )
  })

  it("crea el usuario con emailVerifyToken no nulo", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emailVerifyToken: expect.any(String),
        }),
      })
    )
  })

  it("crea el usuario con emailVerifyExpires en el futuro", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    const before = Date.now()
    await POST(makeRequest(validBody))
    const createCall = (txMock.user.create as jest.Mock).mock.calls[0][0]
    const expires: Date = createCall.data.emailVerifyExpires
    expect(expires.getTime()).toBeGreaterThan(before)
  })

  it("hashea la contraseña con factor 12 antes de guardar", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(bcrypt.hash).toHaveBeenCalledWith("contraseña123", 12)
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordHash: "hashed_password" }),
      })
    )
  })

  it("guarda el nombre y email del usuario correctamente", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Juan Pérez",
          email: "juan@ejemplo.com",
        }),
      })
    )
  })

  it("marca la invitación como utilizada con la fecha actual", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.invitation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "inv-1" },
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      })
    )
  })

  it("busca OWNER incluyendo usuarios con pendingBusinessId del mismo negocio", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { businessId: "biz-1" },
            { pendingBusinessId: "biz-1" },
          ],
        },
      })
    )
  })
})

describe("POST /api/auth/register — webhook n8n", () => {
  beforeEach(() => {
    ;(prisma.invitation.findUnique as jest.Mock).mockResolvedValue(mockInvitation)
    ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(null)
    txMock.user.findFirst.mockResolvedValue(null)
  })

  it("llama al webhook con name, email y code cuando N8N_WEBHOOK_URL está configurado", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.test/webhook/agendify-register"
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.test/webhook/agendify-register",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("juan@ejemplo.com"),
      })
    )
    delete process.env.N8N_WEBHOOK_URL
  })

  it("incluye code en el cuerpo del webhook", async () => {
    process.env.N8N_WEBHOOK_URL = "https://n8n.test/webhook/agendify-register"
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
    const fetchBody = JSON.parse(fetchCall[1].body)
    expect(fetchBody).toHaveProperty("code")
    expect(typeof fetchBody.code).toBe("string")
    expect(fetchBody).toHaveProperty("type", "register")
    expect(fetchBody).not.toHaveProperty("verifyUrl")
    delete process.env.N8N_WEBHOOK_URL
  })

  it("no llama a fetch si N8N_WEBHOOK_URL no está configurado", async () => {
    delete process.env.N8N_WEBHOOK_URL
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe("POST /api/auth/register — error interno", () => {
  it("retorna 500 si prisma lanza excepción", async () => {
    ;(prisma.invitation.findUnique as jest.Mock).mockRejectedValue(new Error("DB error"))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})
