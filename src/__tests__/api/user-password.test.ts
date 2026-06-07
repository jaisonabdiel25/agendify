jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { PATCH } from "@/app/api/user/password/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const authMock = auth as jest.Mock
const userFindMock = prisma.user.findUniqueOrThrow as jest.Mock
const userUpdateMock = prisma.user.update as jest.Mock
const bcryptCompareMock = bcrypt.compare as jest.Mock
const bcryptHashMock = bcrypt.hash as jest.Mock

const mockSession = {
  user: { id: "user-1", businessId: "biz-1", role: "OWNER", name: "Jaison", email: "jaison@test.com" },
  expires: "2099-12-31",
}

const validBody = {
  currentPassword: "currentPass123",
  newPassword: "newPassword123",
  confirmPassword: "newPassword123",
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/user/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("PATCH /api/user/password — autenticación", () => {
  it("retorna 401 sin sesión autenticada", async () => {
    authMock.mockResolvedValue(null)

    const res = await PATCH(makeRequest(validBody))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autorizado")
  })

  it("retorna 401 cuando la sesión no tiene id", async () => {
    authMock.mockResolvedValue({ user: { businessId: "biz-1", role: "STAFF" }, expires: "2099" })

    const res = await PATCH(makeRequest(validBody))

    expect(res.status).toBe(401)
  })
})

describe("PATCH /api/user/password — validación del body", () => {
  it("retorna 400 cuando el body no es JSON válido", async () => {
    authMock.mockResolvedValue(mockSession)
    const req = new Request("http://localhost/api/user/password", {
      method: "PATCH",
      body: "invalid-json",
    })

    const res = await PATCH(req)

    expect(res.status).toBe(400)
  })

  it("retorna 400 si currentPassword está vacío", async () => {
    authMock.mockResolvedValue(mockSession)

    const res = await PATCH(makeRequest({ ...validBody, currentPassword: "" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/requerida/)
  })

  it("retorna 400 si newPassword es muy corto", async () => {
    authMock.mockResolvedValue(mockSession)

    const res = await PATCH(makeRequest({ ...validBody, newPassword: "short", confirmPassword: "short" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/8 caracteres/)
  })

  it("retorna 400 si las contraseñas no coinciden", async () => {
    authMock.mockResolvedValue(mockSession)

    const res = await PATCH(makeRequest({ ...validBody, confirmPassword: "differentPass123" }))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/no coinciden/)
  })
})

describe("PATCH /api/user/password — lógica de negocio", () => {
  it("retorna 400 si la contraseña actual es incorrecta", async () => {
    authMock.mockResolvedValue(mockSession)
    userFindMock.mockResolvedValue({ passwordHash: "hashed" })
    bcryptCompareMock.mockResolvedValue(false)

    const res = await PATCH(makeRequest(validBody))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Contraseña actual incorrecta")
    expect(userUpdateMock).not.toHaveBeenCalled()
  })

  it("retorna 200 y actualiza la contraseña con datos válidos", async () => {
    authMock.mockResolvedValue(mockSession)
    userFindMock.mockResolvedValue({ passwordHash: "hashed" })
    bcryptCompareMock.mockResolvedValue(true)
    bcryptHashMock.mockResolvedValue("newHashedPassword")
    userUpdateMock.mockResolvedValue({})

    const res = await PATCH(makeRequest(validBody))

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe("Contraseña actualizada correctamente")
    expect(bcryptHashMock).toHaveBeenCalledWith("newPassword123", 12)
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { passwordHash: "newHashedPassword" },
    })
  })
})
