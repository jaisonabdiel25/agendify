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

  it("crea el primer usuario del negocio con rol OWNER", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "OWNER" }),
      })
    )
  })

  it("crea usuarios posteriores con rol STAFF cuando ya existe un OWNER", async () => {
    txMock.user.findFirst.mockResolvedValue({ id: "owner-existente" })
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: "STAFF" }),
      })
    )
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

  it("asocia el usuario al businessId de la invitación", async () => {
    txMock.user.findFirst.mockResolvedValue(null)
    await POST(makeRequest(validBody))
    expect(txMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ businessId: "biz-1" }),
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
})
