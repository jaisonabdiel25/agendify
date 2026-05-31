jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    service: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { PATCH } from "@/app/api/services/[id]/route"
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

const mockService = {
  id: "svc-1",
  name: "Corte clásico",
  description: null,
  durationMinutes: 30,
  price: { toString: () => "25.00" },
  color: "#6366f1",
  isActive: true,
}

beforeEach(() => {
  jest.clearAllMocks()
})

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/services/svc-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/services/[id] — autenticación", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ name: "Nuevo" }), makeParams("svc-1"))
    expect(res.status).toBe(401)
  })

  it("retorna 401 para rol STAFF", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const res = await PATCH(makeRequest({ name: "Nuevo" }), makeParams("svc-1"))
    expect(res.status).toBe(401)
  })

  it("permite PATCH al rol ADMIN", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue(mockService)
    ;(prisma.service.update as jest.Mock).mockResolvedValue({
      ...mockService,
      price: { toString: () => "25.00" },
    })
    const res = await PATCH(makeRequest({ name: "Nombre válido" }), makeParams("svc-1"))
    expect(res.status).toBe(200)
  })
})

describe("PATCH /api/services/[id] — body no parseable", () => {
  it("retorna 400 cuando el body no es JSON válido", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.service.findFirst).mockResolvedValue(
      mockService as unknown as Awaited<ReturnType<typeof prisma.service.findFirst>>
    )
    const req = new Request("http://localhost/api/services/svc-1", {
      method: "PATCH",
      body: "invalid-json-body",
    })
    const res = await PATCH(req, makeParams("svc-1"))
    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/services/[id] — validación de datos", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue(mockService)
  })

  it("retorna 400 con nombre de 1 carácter", async () => {
    const res = await PATCH(makeRequest({ name: "A" }), makeParams("svc-1"))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con durationMinutes igual a 0", async () => {
    const res = await PATCH(makeRequest({ durationMinutes: 0 }), makeParams("svc-1"))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con precio negativo", async () => {
    const res = await PATCH(makeRequest({ price: -1 }), makeParams("svc-1"))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con color con formato incorrecto", async () => {
    const res = await PATCH(makeRequest({ color: "azul" }), makeParams("svc-1"))
    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/services/[id] — recurso", () => {
  it("retorna 404 cuando el servicio no existe en el negocio", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await PATCH(makeRequest({ name: "Válido" }), makeParams("svc-99"))
    expect(res.status).toBe(404)
  })

  it("filtra el servicio por businessId de la sesión", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue(mockService)
    ;(prisma.service.update as jest.Mock).mockResolvedValue({
      ...mockService,
      price: { toString: () => "25.00" },
    })
    await PATCH(makeRequest({ name: "Nombre válido" }), makeParams("svc-1"))
    expect(prisma.service.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ businessId: "biz-1" }),
      })
    )
  })
})

describe("PATCH /api/services/[id] — actualización exitosa", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue(mockService)
  })

  it("retorna 200 con los datos actualizados", async () => {
    ;(prisma.service.update as jest.Mock).mockResolvedValue({
      ...mockService,
      name: "Corte actualizado",
      price: { toString: () => "30.00" },
    })
    const res = await PATCH(makeRequest({ name: "Corte actualizado", price: 30 }), makeParams("svc-1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe("Corte actualizado")
    expect(body.price).toBe("30.00")
  })

  it("acepta precio igual a 0 (servicio gratuito)", async () => {
    ;(prisma.service.update as jest.Mock).mockResolvedValue({
      ...mockService,
      price: { toString: () => "0.00" },
    })
    const res = await PATCH(makeRequest({ price: 0 }), makeParams("svc-1"))
    expect(res.status).toBe(200)
  })

  it("acepta actualizaciones parciales (solo un campo)", async () => {
    ;(prisma.service.update as jest.Mock).mockResolvedValue({
      ...mockService,
      isActive: false,
      price: { toString: () => "25.00" },
    })
    const res = await PATCH(makeRequest({ isActive: false }), makeParams("svc-1"))
    expect(res.status).toBe(200)
  })
})
