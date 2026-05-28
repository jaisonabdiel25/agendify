jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    plan: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { PATCH } from "@/app/api/admin/plans/[id]/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockAdminSession = {
  user: { id: "admin-1", role: "ADMIN" },
  expires: "2099-12-31",
}

const existingPlan = {
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
  createdAt: new Date(),
}

const validBody = {
  name: "Pro Plus",
  maxServices: 3,
  maxChairs: 5,
  maxUsers: 5,
  canInvite: true,
  statisticsCharts: ["*"],
  price: 39.99,
  discount: 10,
}

beforeEach(() => {
  jest.clearAllMocks()
})

function makeRequest(body: unknown, id = "plan_pro_v1") {
  return {
    request: new Request(`http://localhost/api/admin/plans/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    params: Promise.resolve({ id }),
  }
}

describe("PATCH /api/admin/plans/[id] — autorización", () => {
  it("retorna 403 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const { request, params } = makeRequest(validBody)
    const res = await PATCH(request, { params })
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol OWNER", async () => {
    authMock.mockResolvedValue({ user: { role: "OWNER" } })
    const { request, params } = makeRequest(validBody)
    const res = await PATCH(request, { params })
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol STAFF", async () => {
    authMock.mockResolvedValue({ user: { role: "STAFF" } })
    const { request, params } = makeRequest(validBody)
    const res = await PATCH(request, { params })
    expect(res.status).toBe(403)
  })
})

describe("PATCH /api/admin/plans/[id] — validación", () => {
  beforeEach(() => authMock.mockResolvedValue(mockAdminSession))

  it("retorna 400 con nombre de 1 carácter", async () => {
    jest.mocked(prisma.plan.findUnique).mockResolvedValue(
      existingPlan as unknown as Awaited<ReturnType<typeof prisma.plan.findUnique>>
    )
    const { request, params } = makeRequest({ ...validBody, name: "P" })
    const res = await PATCH(request, { params })
    expect(res.status).toBe(400)
  })

  it("retorna 400 con maxServices menor a 1", async () => {
    jest.mocked(prisma.plan.findUnique).mockResolvedValue(
      existingPlan as unknown as Awaited<ReturnType<typeof prisma.plan.findUnique>>
    )
    const { request, params } = makeRequest({ ...validBody, maxServices: 0 })
    const res = await PATCH(request, { params })
    expect(res.status).toBe(400)
  })

  it("retorna 400 con descuento mayor a 100", async () => {
    jest.mocked(prisma.plan.findUnique).mockResolvedValue(
      existingPlan as unknown as Awaited<ReturnType<typeof prisma.plan.findUnique>>
    )
    const { request, params } = makeRequest({ ...validBody, discount: 101 })
    const res = await PATCH(request, { params })
    expect(res.status).toBe(400)
  })

  it("retorna 400 con precio negativo", async () => {
    jest.mocked(prisma.plan.findUnique).mockResolvedValue(
      existingPlan as unknown as Awaited<ReturnType<typeof prisma.plan.findUnique>>
    )
    const { request, params } = makeRequest({ ...validBody, price: -5 })
    const res = await PATCH(request, { params })
    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/admin/plans/[id] — no encontrado", () => {
  beforeEach(() => authMock.mockResolvedValue(mockAdminSession))

  it("retorna 404 cuando el plan no existe", async () => {
    jest.mocked(prisma.plan.findUnique).mockResolvedValue(null)
    const { request, params } = makeRequest(validBody, "plan-inexistente")
    const res = await PATCH(request, { params })
    expect(res.status).toBe(404)
  })
})

describe("PATCH /api/admin/plans/[id] — actualización exitosa", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockAdminSession)
    jest.mocked(prisma.plan.findUnique).mockResolvedValue(
      existingPlan as unknown as Awaited<ReturnType<typeof prisma.plan.findUnique>>
    )
    jest.mocked(prisma.plan.update).mockResolvedValue({
      ...existingPlan,
      name: "Pro Plus",
      maxServices: 3,
      maxChairs: 5,
      maxUsers: 5,
      price: { toString: () => "39.99" },
      discount: 10,
    } as unknown as Awaited<ReturnType<typeof prisma.plan.update>>)
  })

  it("retorna 200 con el plan actualizado", async () => {
    const { request, params } = makeRequest(validBody)
    const res = await PATCH(request, { params })
    expect(res.status).toBe(200)
  })

  it("serializa price como string en la respuesta", async () => {
    const { request, params } = makeRequest(validBody)
    const res = await PATCH(request, { params })
    const body = await res.json()
    expect(body.price).toBe("39.99")
  })

  it("incluye discount en la respuesta", async () => {
    const { request, params } = makeRequest(validBody)
    const res = await PATCH(request, { params })
    const body = await res.json()
    expect(body.discount).toBe(10)
  })

  it("acepta price null", async () => {
    jest.mocked(prisma.plan.update).mockResolvedValue({
      ...existingPlan,
      price: null,
      discount: null,
    } as unknown as Awaited<ReturnType<typeof prisma.plan.update>>)
    const { request, params } = makeRequest({ ...validBody, price: null, discount: null })
    const res = await PATCH(request, { params })
    const body = await res.json()
    expect(body.price).toBeNull()
    expect(body.discount).toBeNull()
  })

  it("llama a prisma.plan.update con los datos correctos", async () => {
    const { request, params } = makeRequest(validBody)
    await PATCH(request, { params })
    expect(prisma.plan.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "plan_pro_v1" },
        data: expect.objectContaining({ name: "Pro Plus", maxServices: 3 }),
      })
    )
  })

  it("retorna 500 en error interno", async () => {
    jest.mocked(prisma.plan.update).mockRejectedValue(new Error("DB error"))
    const { request, params } = makeRequest(validBody)
    const res = await PATCH(request, { params })
    expect(res.status).toBe(500)
  })
})
