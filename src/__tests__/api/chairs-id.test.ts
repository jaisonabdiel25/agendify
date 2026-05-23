jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    chair: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  },
}))

import { GET, PATCH } from "@/app/api/chairs/[id]/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockOwnerSession = {
  user: { id: "user-1", businessId: "biz-1", role: "OWNER", name: "Dueño", email: "owner@test.com" },
  expires: "2099-12-31",
}
const mockAdminSession = {
  user: { id: "user-2", businessId: "biz-1", role: "ADMIN", name: "Admin", email: "admin@test.com" },
  expires: "2099-12-31",
}
const mockStaffSession = {
  user: { id: "user-3", businessId: "biz-1", role: "STAFF", name: "Staff", email: "staff@test.com" },
  expires: "2099-12-31",
}

const mockChair = {
  id: "chair-1",
  name: "Silla Premium",
  description: "Una silla cómoda",
  color: "#6366f1",
  isActive: true,
  userId: null,
  user: null,
}

beforeEach(() => {
  jest.clearAllMocks()
})

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makePatchRequest(body: unknown) {
  return new Request("http://localhost/api/chairs/chair-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/chairs/[id]", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(new Request("http://localhost"), makeParams("chair-1"))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autorizado")
  })

  it("retorna 404 cuando el puesto no existe en el negocio", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await GET(new Request("http://localhost"), makeParams("chair-99"))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/no encontrado/i)
  })

  it("retorna 200 con los datos del puesto", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(mockChair)
    const res = await GET(new Request("http://localhost"), makeParams("chair-1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe("chair-1")
    expect(body.name).toBe("Silla Premium")
  })

  it("filtra el puesto por businessId de la sesión", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(mockChair)
    await GET(new Request("http://localhost"), makeParams("chair-1"))
    expect(prisma.chair.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "chair-1", businessId: "biz-1" }),
      })
    )
  })

  it("permite acceso al rol STAFF", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(mockChair)
    const res = await GET(new Request("http://localhost"), makeParams("chair-1"))
    expect(res.status).toBe(200)
  })
})

// ─── PATCH ────────────────────────────────────────────────────────────────────

describe("PATCH /api/chairs/[id]", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await PATCH(makePatchRequest({ name: "Nuevo" }), makeParams("chair-1"))
    expect(res.status).toBe(401)
  })

  it("retorna 403 para rol STAFF", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const res = await PATCH(makePatchRequest({ name: "Nuevo" }), makeParams("chair-1"))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/permisos/i)
  })

  it("permite PATCH al rol ADMIN", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue({ id: "chair-1" })
    ;(prisma.chair.update as jest.Mock).mockResolvedValue({ ...mockChair, name: "Nuevo" })
    const res = await PATCH(makePatchRequest({ name: "Nuevo" }), makeParams("chair-1"))
    expect(res.status).toBe(200)
  })

  it("retorna 400 con nombre de 1 carácter", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    const res = await PATCH(makePatchRequest({ name: "A" }), makeParams("chair-1"))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con color en formato incorrecto", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    const res = await PATCH(makePatchRequest({ color: "rojo" }), makeParams("chair-1"))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con body no parseable como JSON", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    const req = new Request("http://localhost/api/chairs/chair-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "no-es-json",
    })
    const res = await PATCH(req, makeParams("chair-1"))
    expect(res.status).toBe(400)
  })

  it("retorna 404 cuando el puesto no existe en el negocio", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await PATCH(makePatchRequest({ name: "Nombre válido" }), makeParams("chair-99"))
    expect(res.status).toBe(404)
  })

  it("retorna 400 cuando userId no pertenece al negocio", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue({ id: "chair-1" })
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await PATCH(makePatchRequest({ userId: "user-extraño" }), makeParams("chair-1"))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Usuario no válido")
  })

  it("retorna 200 al actualizar el nombre", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue({ id: "chair-1" })
    ;(prisma.chair.update as jest.Mock).mockResolvedValue({ ...mockChair, name: "Silla Actualizada" })
    const res = await PATCH(makePatchRequest({ name: "Silla Actualizada" }), makeParams("chair-1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe("Silla Actualizada")
  })

  it("acepta userId como null para desasignar el puesto", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue({ id: "chair-1" })
    ;(prisma.chair.update as jest.Mock).mockResolvedValue({ ...mockChair, userId: null })
    const res = await PATCH(makePatchRequest({ userId: null }), makeParams("chair-1"))
    expect(res.status).toBe(200)
    expect(prisma.user.findFirst).not.toHaveBeenCalled()
  })

  it("asigna al usuario válido del mismo negocio", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.chair.findFirst as jest.Mock).mockResolvedValue({ id: "chair-1" })
    ;(prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: "user-1" })
    ;(prisma.chair.update as jest.Mock).mockResolvedValue({ ...mockChair, userId: "user-1" })
    const res = await PATCH(makePatchRequest({ userId: "user-1" }), makeParams("chair-1"))
    expect(res.status).toBe(200)
  })
})
