jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    service: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
  },
}))

import { GET, POST } from "@/app/api/services/route"
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
  businessId: "biz-1",
  name: "Corte de cabello",
  description: "Servicio premium",
  durationMinutes: 60,
  isActive: true,
  color: "#6366f1",
  price: { toString: () => "25.00" },
}

const validServiceBody = {
  name: "Corte clásico",
  durationMinutes: 45,
  price: 20,
  color: "#6366f1",
  isActive: true,
}

const mockProBusinessPlan = { plan: { type: "PRO" } }

beforeEach(() => {
  jest.clearAllMocks()
})

describe("GET /api/services", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autorizado")
  })

  it("retorna 401 para rol STAFF (sin permisos de gestión)", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retorna 200 para OWNER con lista de servicios", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.service.findMany).mockResolvedValue(
      [mockService] as unknown as Awaited<ReturnType<typeof prisma.service.findMany>>
    )

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe("Corte de cabello")
    expect(body[0].price).toBe("25.00")
  })

  it("retorna 200 para ADMIN con lista de servicios", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    jest.mocked(prisma.service.findMany).mockResolvedValue([])

    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("filtra por businessId del usuario", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.service.findMany).mockResolvedValue([])

    await GET()
    const callArgs = jest.mocked(prisma.service.findMany).mock.calls[0][0]
    expect(callArgs?.where?.businessId).toBe("biz-1")
  })
})

describe("POST /api/services", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validServiceBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("retorna 401 para STAFF", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validServiceBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("retorna 400 con nombre demasiado corto (< 2 chars)", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validServiceBody, name: "A" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("retorna 400 con color inválido (sin #)", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validServiceBody, color: "rojo" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("retorna 400 con precio negativo", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validServiceBody, price: -10 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("retorna 403 cuando plan STANDARD ya tiene 1 servicio activo", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      { plan: { type: "STANDARD" } } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.service.count).mockResolvedValue(1)

    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validServiceBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("Estándar")
  })

  it("retorna 403 cuando plan PRO ya tiene 2 servicios activos", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      { plan: { type: "PRO" } } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.service.count).mockResolvedValue(2)

    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validServiceBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("Pro")
  })

  it("retorna 201 con el servicio creado", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusinessPlan as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.service.count).mockResolvedValue(0)
    jest.mocked(prisma.service.create).mockResolvedValue({
      ...mockService,
      name: validServiceBody.name,
    } as unknown as Awaited<ReturnType<typeof prisma.service.create>>)

    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validServiceBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe(validServiceBody.name)
    expect(body.price).toBe("25.00")
  })

  it("retorna 201 para ADMIN también", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusinessPlan as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.service.count).mockResolvedValue(0)
    jest.mocked(prisma.service.create).mockResolvedValue(
      mockService as unknown as Awaited<ReturnType<typeof prisma.service.create>>
    )

    const req = new Request("http://localhost/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validServiceBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })
})
