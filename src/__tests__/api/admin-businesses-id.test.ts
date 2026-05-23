jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

import { PATCH } from "@/app/api/admin/businesses/[id]/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockAdminSession = {
  user: { id: "admin-1", role: "ADMIN" },
  expires: "2099-12-31",
}

beforeEach(() => {
  jest.clearAllMocks()
})

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe("PATCH /api/admin/businesses/[id] — autorización", () => {
  it("retorna 403 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await PATCH(new Request("http://localhost"), makeParams("biz-1"))
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol OWNER", async () => {
    authMock.mockResolvedValue({ user: { role: "OWNER" } })
    const res = await PATCH(new Request("http://localhost"), makeParams("biz-1"))
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol STAFF", async () => {
    authMock.mockResolvedValue({ user: { role: "STAFF" } })
    const res = await PATCH(new Request("http://localhost"), makeParams("biz-1"))
    expect(res.status).toBe(403)
  })
})

describe("PATCH /api/admin/businesses/[id] — recurso", () => {
  it("retorna 404 cuando el negocio no existe", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(null)
    const res = await PATCH(new Request("http://localhost"), makeParams("biz-99"))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/no encontrado/i)
  })
})

describe("PATCH /api/admin/businesses/[id] — toggle isActive", () => {
  it("retorna 200 al cambiar estado del negocio", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ isActive: true })
    ;(prisma.business.update as jest.Mock).mockResolvedValue({ id: "biz-1", isActive: false })
    const res = await PATCH(new Request("http://localhost"), makeParams("biz-1"))
    expect(res.status).toBe(200)
  })

  it("invierte isActive de true a false", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ isActive: true })
    ;(prisma.business.update as jest.Mock).mockResolvedValue({ id: "biz-1", isActive: false })
    await PATCH(new Request("http://localhost"), makeParams("biz-1"))
    expect(prisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } })
    )
  })

  it("invierte isActive de false a true", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ isActive: false })
    ;(prisma.business.update as jest.Mock).mockResolvedValue({ id: "biz-1", isActive: true })
    await PATCH(new Request("http://localhost"), makeParams("biz-1"))
    expect(prisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: true } })
    )
  })

  it("retorna el id y el nuevo estado en la respuesta", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue({ isActive: true })
    ;(prisma.business.update as jest.Mock).mockResolvedValue({ id: "biz-1", isActive: false })
    const res = await PATCH(new Request("http://localhost"), makeParams("biz-1"))
    const body = await res.json()
    expect(body.id).toBe("biz-1")
    expect(body.isActive).toBe(false)
  })
})
