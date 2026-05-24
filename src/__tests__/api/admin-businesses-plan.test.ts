jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    plan: {
      findUnique: jest.fn(),
    },
  },
}))

import { PATCH } from "@/app/api/admin/businesses/[id]/plan/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockAdminSession = {
  user: { id: "admin-1", role: "ADMIN" },
  expires: "2099-12-31",
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/businesses/biz-1/plan", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

function makeParams(id = "biz-1") {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("PATCH /api/admin/businesses/[id]/plan — autorización", () => {
  it("retorna 403 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await PATCH(makeRequest({ planId: "plan_pro_v1" }), makeParams())
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol OWNER", async () => {
    authMock.mockResolvedValue({ user: { role: "OWNER" } })
    const res = await PATCH(makeRequest({ planId: "plan_pro_v1" }), makeParams())
    expect(res.status).toBe(403)
  })
})

describe("PATCH /api/admin/businesses/[id]/plan — validación", () => {
  beforeEach(() => authMock.mockResolvedValue(mockAdminSession))

  it("retorna 400 sin planId", async () => {
    const res = await PATCH(makeRequest({}), makeParams())
    expect(res.status).toBe(400)
  })

  it("retorna 404 cuando el negocio no existe", async () => {
    jest.mocked(prisma.business.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.plan.findUnique).mockResolvedValue({ id: "plan_pro_v1" } as unknown as Awaited<ReturnType<typeof prisma.plan.findUnique>>)
    const res = await PATCH(makeRequest({ planId: "plan_pro_v1" }), makeParams("biz-99"))
    expect(res.status).toBe(404)
  })

  it("retorna 400 cuando el plan no existe", async () => {
    jest.mocked(prisma.business.findUnique).mockResolvedValue({ id: "biz-1" } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
    jest.mocked(prisma.plan.findUnique).mockResolvedValue(null)
    const res = await PATCH(makeRequest({ planId: "plan_invalido" }), makeParams())
    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/admin/businesses/[id]/plan — actualización exitosa", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockAdminSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue({ id: "biz-1" } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
    jest.mocked(prisma.plan.findUnique).mockResolvedValue({ id: "plan_standard_v1" } as unknown as Awaited<ReturnType<typeof prisma.plan.findUnique>>)
    jest.mocked(prisma.business.update).mockResolvedValue({
      id: "biz-1",
      planId: "plan_standard_v1",
    } as unknown as Awaited<ReturnType<typeof prisma.business.update>>)
  })

  it("retorna 200 con el negocio actualizado", async () => {
    const res = await PATCH(makeRequest({ planId: "plan_standard_v1" }), makeParams())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.planId).toBe("plan_standard_v1")
  })

  it("llama a prisma.business.update con los datos correctos", async () => {
    await PATCH(makeRequest({ planId: "plan_standard_v1" }), makeParams())
    expect(prisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "biz-1" },
        data: { planId: "plan_standard_v1" },
      })
    )
  })
})
