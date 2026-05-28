jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    plan: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { GET, POST } from "@/app/api/admin/plans/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockAdminSession = {
  user: { id: "admin-1", role: "ADMIN" },
  expires: "2099-12-31",
}

const mockPlans = [
  {
    id: "plan_standard_v1",
    type: "STANDARD",
    name: "Estándar",
    maxServices: 1,
    maxChairs: 1,
    maxUsers: 1,
    canInvite: false,
    statisticsCharts: ["status"],
    price: { toString: () => "0.00" },
    discount: null,
    createdAt: new Date("2024-01-01"),
  },
  {
    id: "plan_pro_v1",
    type: "PRO",
    name: "Pro",
    maxServices: 2,
    maxChairs: 3,
    maxUsers: 3,
    canInvite: true,
    statisticsCharts: ["*"],
    price: { toString: () => "29.99" },
    discount: null,
    createdAt: new Date("2024-01-01"),
  },
]

const validPostBody = {
  type: "ENTERPRISE",
  name: "Enterprise",
  maxServices: 5,
  maxChairs: 10,
  maxUsers: 10,
  canInvite: true,
  statisticsCharts: ["*"],
  price: 99.99,
  discount: null,
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/admin/plans — autorización", () => {
  it("retorna 403 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol OWNER", async () => {
    authMock.mockResolvedValue({ user: { role: "OWNER" } })
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol STAFF", async () => {
    authMock.mockResolvedValue({ user: { role: "STAFF" } })
    const res = await GET()
    expect(res.status).toBe(403)
  })
})

describe("GET /api/admin/plans — éxito", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockAdminSession)
    jest.mocked(prisma.plan.findMany).mockResolvedValue(
      mockPlans as unknown as Awaited<ReturnType<typeof prisma.plan.findMany>>
    )
  })

  it("retorna 200 con la lista de planes", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
  })

  it("serializa price como string", async () => {
    const res = await GET()
    const body = await res.json()
    expect(body[0].price).toBe("0.00")
    expect(body[1].price).toBe("29.99")
  })

  it("retorna null cuando price es null", async () => {
    jest.mocked(prisma.plan.findMany).mockResolvedValue([
      { ...mockPlans[0], price: null } as unknown as Awaited<ReturnType<typeof prisma.plan.findMany>>[number],
    ])
    const res = await GET()
    const body = await res.json()
    expect(body[0].price).toBeNull()
  })

  it("retorna 500 cuando prisma lanza error", async () => {
    jest.mocked(prisma.plan.findMany).mockRejectedValue(new Error("DB error"))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ─── POST ─────────────────────────────────────────────────────────────────────

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/admin/plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/admin/plans — autorización", () => {
  it("retorna 403 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makePostRequest(validPostBody))
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol OWNER", async () => {
    authMock.mockResolvedValue({ user: { role: "OWNER" } })
    const res = await POST(makePostRequest(validPostBody))
    expect(res.status).toBe(403)
  })
})

describe("POST /api/admin/plans — validación", () => {
  beforeEach(() => authMock.mockResolvedValue(mockAdminSession))

  it("retorna 400 con type de 1 carácter", async () => {
    const res = await POST(makePostRequest({ ...validPostBody, type: "E" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con nombre de 1 carácter", async () => {
    const res = await POST(makePostRequest({ ...validPostBody, name: "E" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con maxServices menor a 1", async () => {
    const res = await POST(makePostRequest({ ...validPostBody, maxServices: 0 }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con maxChairs menor a 1", async () => {
    const res = await POST(makePostRequest({ ...validPostBody, maxChairs: 0 }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con maxUsers menor a 1", async () => {
    const res = await POST(makePostRequest({ ...validPostBody, maxUsers: 0 }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con descuento mayor a 100", async () => {
    const res = await POST(makePostRequest({ ...validPostBody, discount: 101 }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con precio negativo", async () => {
    const res = await POST(makePostRequest({ ...validPostBody, price: -1 }))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/admin/plans — conflicto de tipo", () => {
  beforeEach(() => authMock.mockResolvedValue(mockAdminSession))

  it("retorna 409 cuando el tipo ya existe", async () => {
    jest.mocked(prisma.plan.findFirst).mockResolvedValue(
      mockPlans[0] as unknown as Awaited<ReturnType<typeof prisma.plan.findFirst>>
    )
    const res = await POST(makePostRequest({ ...validPostBody, type: "STANDARD" }))
    expect(res.status).toBe(409)
  })
})

describe("POST /api/admin/plans — creación exitosa", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockAdminSession)
    jest.mocked(prisma.plan.findFirst).mockResolvedValue(null)
    jest.mocked(prisma.plan.create).mockResolvedValue({
      id: "plan_enterprise",
      ...validPostBody,
      price: { toString: () => "99.99" },
      createdAt: new Date(),
      businesses: [],
    } as unknown as Awaited<ReturnType<typeof prisma.plan.create>>)
  })

  it("retorna 201 al crear un plan válido", async () => {
    const res = await POST(makePostRequest(validPostBody))
    expect(res.status).toBe(201)
  })

  it("incluye price serializado en la respuesta", async () => {
    const res = await POST(makePostRequest(validPostBody))
    const body = await res.json()
    expect(body.price).toBe("99.99")
  })

  it("crea el plan con los datos correctos", async () => {
    await POST(makePostRequest(validPostBody))
    expect(prisma.plan.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ type: "ENTERPRISE", name: "Enterprise" }),
      })
    )
  })

  it("acepta price null", async () => {
    jest.mocked(prisma.plan.create).mockResolvedValue({
      id: "plan_enterprise",
      ...validPostBody,
      price: null,
      createdAt: new Date(),
    } as unknown as Awaited<ReturnType<typeof prisma.plan.create>>)
    const res = await POST(makePostRequest({ ...validPostBody, price: null }))
    const body = await res.json()
    expect(body.price).toBeNull()
  })

  it("retorna 500 en error interno", async () => {
    jest.mocked(prisma.plan.create).mockRejectedValue(new Error("DB error"))
    const res = await POST(makePostRequest(validPostBody))
    expect(res.status).toBe(500)
  })
})
