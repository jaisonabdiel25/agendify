jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    chair: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
  },
}))

import { GET, POST } from "@/app/api/chairs/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockOwnerSession = {
  user: { id: "user-1", businessId: "biz-1", role: "OWNER", name: "Dueño", email: "owner@test.com" },
  expires: "2099-12-31",
}
const mockStaffSession = {
  user: { id: "user-3", businessId: "biz-1", role: "STAFF", name: "Staff", email: "staff@test.com" },
  expires: "2099-12-31",
}

const mockChair = {
  id: "chair-1",
  name: "Silla Premium",
  color: "#6366f1",
  avatarUrl: null,
}

const validChairBody = { name: "Silla nueva", color: "#6366f1" }
const mockProBusinessPlan = { plan: { type: "PRO" } }

beforeEach(() => {
  jest.clearAllMocks()
})

describe("GET /api/chairs", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe("No autorizado")
  })

  it("retorna 200 con lista de sillas activas para OWNER", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.chair.findMany).mockResolvedValue(
      [mockChair] as unknown as Awaited<ReturnType<typeof prisma.chair.findMany>>
    )

    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe("Silla Premium")
  })

  it("retorna 200 para STAFF (solo lectura está permitida)", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    jest.mocked(prisma.chair.findMany).mockResolvedValue([])

    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("filtra por businessId e isActive:true", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.chair.findMany).mockResolvedValue([])

    await GET()
    const callArgs = jest.mocked(prisma.chair.findMany).mock.calls[0][0]
    expect(callArgs?.where?.businessId).toBe("biz-1")
    expect(callArgs?.where?.isActive).toBe(true)
  })
})

describe("POST /api/chairs", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validChairBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("retorna 403 para STAFF (sin permisos de creación)", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validChairBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("permisos")
  })

  it("retorna 400 con nombre demasiado corto (< 2 chars)", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("retorna 400 con color inválido", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Silla válida", color: "azul" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("retorna 403 cuando plan STANDARD ya tiene 1 puesto activo", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      { plan: { type: "STANDARD" } } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.chair.count).mockResolvedValue(1)

    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validChairBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("Estándar")
  })

  it("retorna 403 cuando plan PRO ya tiene 3 puestos activos", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      { plan: { type: "PRO" } } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.chair.count).mockResolvedValue(3)

    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validChairBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("Pro")
  })

  it("retorna 400 si userId no pertenece al negocio", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusinessPlan as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.chair.count).mockResolvedValue(0)
    jest.mocked(prisma.user.findFirst).mockResolvedValue(null)

    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validChairBody, userId: "user-externo" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe("Usuario no válido")
  })

  it("retorna 201 con la silla creada por OWNER", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusinessPlan as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.chair.count).mockResolvedValue(0)
    jest.mocked(prisma.chair.create).mockResolvedValue({
      id: "new-chair",
      businessId: "biz-1",
      name: "Silla nueva",
      color: "#6366f1",
      isActive: true,
      description: null,
      userId: null,
      avatarUrl: null,
    } as unknown as Awaited<ReturnType<typeof prisma.chair.create>>)

    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validChairBody),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe("Silla nueva")
  })

  it("crea silla con userId válido cuando el usuario pertenece al negocio", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusinessPlan as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.chair.count).mockResolvedValue(0)
    jest.mocked(prisma.user.findFirst).mockResolvedValue({
      id: "user-2",
    } as unknown as Awaited<ReturnType<typeof prisma.user.findFirst>>)
    jest.mocked(prisma.chair.create).mockResolvedValue({
      id: "new-chair",
      businessId: "biz-1",
      name: "Silla con staff",
      color: "#6366f1",
      isActive: true,
      description: null,
      userId: "user-2",
      avatarUrl: null,
    } as unknown as Awaited<ReturnType<typeof prisma.chair.create>>)

    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validChairBody, userId: "user-2" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.name).toBe("Silla con staff")
  })

  it("usa color por defecto #6366f1 si no se provee color", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusinessPlan as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.chair.count).mockResolvedValue(0)
    jest.mocked(prisma.chair.create).mockResolvedValue({
      id: "new-chair",
      name: "Sin color",
      color: "#6366f1",
      businessId: "biz-1",
      isActive: true,
      description: null,
      userId: null,
      avatarUrl: null,
    } as unknown as Awaited<ReturnType<typeof prisma.chair.create>>)

    const req = new Request("http://localhost/api/chairs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Sin color" }),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)

    const callArgs = jest.mocked(prisma.chair.create).mock.calls[0][0]
    expect(callArgs?.data?.color).toBe("#6366f1")
  })
})
