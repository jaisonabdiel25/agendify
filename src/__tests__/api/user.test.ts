jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { GET, PATCH } from "@/app/api/user/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock
const userFindMock = prisma.user.findUniqueOrThrow as jest.Mock
const userUpdateMock = prisma.user.update as jest.Mock

const mockSession = {
  user: { id: "user-1", businessId: "biz-1", role: "OWNER", name: "Jaison", email: "jaison@test.com" },
  expires: "2099-12-31",
}

const mockUser = {
  id: "user-1",
  name: "Jaison",
  email: "jaison@test.com",
  role: "OWNER",
  description: "Desarrollador",
  avatarUrl: null,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("GET /api/user", () => {
  it("retorna 401 sin sesión autenticada", async () => {
    authMock.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autorizado")
  })

  it("retorna 401 cuando la sesión no tiene id", async () => {
    authMock.mockResolvedValue({
      user: { businessId: "biz-1", role: "STAFF" },
      expires: "2099",
    })

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it("retorna 200 con los datos del usuario autenticado", async () => {
    authMock.mockResolvedValue(mockSession)
    userFindMock.mockResolvedValue(mockUser)

    const res = await GET()

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe("user-1")
    expect(body.name).toBe("Jaison")
    expect(body.description).toBe("Desarrollador")
    expect(userFindMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: expect.objectContaining({ id: true, name: true, email: true }),
    })
  })
})

describe("PATCH /api/user — body no parseable", () => {
  it("retorna 400 cuando el body no es JSON válido", async () => {
    authMock.mockResolvedValue(mockSession)
    const req = new Request("http://localhost/api/user", {
      method: "PATCH",
      body: "invalid-json-body",
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/user", () => {
  it("retorna 401 sin sesión autenticada", async () => {
    authMock.mockResolvedValue(null)

    const req = new Request("http://localhost/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nuevo nombre" }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autorizado")
  })

  it("retorna 400 con nombre demasiado corto", async () => {
    authMock.mockResolvedValue(mockSession)

    const req = new Request("http://localhost/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/2 caracteres/)
  })

  it("retorna 400 con descripción demasiado larga", async () => {
    authMock.mockResolvedValue(mockSession)

    const req = new Request("http://localhost/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jaison", description: "a".repeat(201) }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/200 caracteres/)
  })

  it("retorna 200 y actualiza nombre y descripción", async () => {
    authMock.mockResolvedValue(mockSession)
    userUpdateMock.mockResolvedValue({ id: "user-1", name: "Jaison Palacio", description: "Dev" })

    const req = new Request("http://localhost/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jaison Palacio", description: "Dev" }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe("Jaison Palacio")
    expect(body.description).toBe("Dev")
    expect(userUpdateMock).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Jaison Palacio", description: "Dev" },
      select: expect.objectContaining({ id: true, name: true, description: true }),
    })
  })

  it("retorna 200 con descripción vacía y la guarda como null", async () => {
    authMock.mockResolvedValue(mockSession)
    userUpdateMock.mockResolvedValue({ id: "user-1", name: "Jaison", description: null })

    const req = new Request("http://localhost/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Jaison" }),
    })
    const res = await PATCH(req)

    expect(res.status).toBe(200)
    expect(userUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: { name: "Jaison", description: null } })
    )
  })
})
