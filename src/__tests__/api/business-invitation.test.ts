jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    invitation: { findUnique: jest.fn(), create: jest.fn() },
    business: { findUnique: jest.fn() },
    user: { count: jest.fn() },
  },
}))

import { POST } from "@/app/api/business/invitation/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockOwnerSession = {
  user: { id: "user-1", businessId: "biz-1", role: "OWNER" },
  expires: "2099-12-31",
}
const mockAdminSession = {
  user: { id: "user-2", businessId: "biz-1", role: "ADMIN" },
  expires: "2099-12-31",
}
const mockStaffSession = {
  user: { id: "user-3", businessId: "biz-1", role: "STAFF" },
  expires: "2099-12-31",
}

const mockProBusiness = { plan: { type: "PRO" } }

beforeEach(() => {
  jest.clearAllMocks()
})

describe("POST /api/business/invitation — autorización", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await POST()
    expect(res.status).toBe(401)
  })

  it("retorna 403 para rol STAFF", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const res = await POST()
    expect(res.status).toBe(403)
  })

  it("retorna 403 para plan STANDARD (no permite invitaciones)", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      { plan: { type: "STANDARD" } } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    const res = await POST()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("Estándar")
  })

  it("retorna 403 para plan PRO cuando ya hay 3 usuarios", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.user.count).mockResolvedValue(3)
    const res = await POST()
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("Pro")
  })

  it("permite al rol ADMIN crear invitaciones", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.user.count).mockResolvedValue(1)
    jest.mocked(prisma.invitation.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.invitation.create).mockResolvedValue({
      id: "inv-1",
      code: "ABCD-1234",
      createdAt: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof prisma.invitation.create>>)
    const res = await POST()
    expect(res.status).toBe(201)
  })
})

describe("POST /api/business/invitation — creación exitosa", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockOwnerSession)
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockProBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.user.count).mockResolvedValue(1)
    jest.mocked(prisma.invitation.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.invitation.create).mockResolvedValue({
      id: "inv-1",
      code: "ABCD-1234",
      createdAt: new Date().toISOString(),
    } as unknown as Awaited<ReturnType<typeof prisma.invitation.create>>)
  })

  it("retorna 201 con la invitación generada", async () => {
    const res = await POST()
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.code).toBe("ABCD-1234")
  })

  it("asocia la invitación al businessId de la sesión", async () => {
    await POST()
    expect(prisma.invitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ businessId: "biz-1", createdById: "user-1" }),
      })
    )
  })

  it("reintenta el código si ya existe uno igual", async () => {
    jest.mocked(prisma.invitation.findUnique)
      .mockResolvedValueOnce({ id: "existing" } as unknown as Awaited<ReturnType<typeof prisma.invitation.findUnique>>)
      .mockResolvedValueOnce(null)
    await POST()
    expect(prisma.invitation.findUnique).toHaveBeenCalledTimes(2)
  })

  it("el código tiene formato XXXX-XXXX (8 caracteres con guión)", async () => {
    const res = await POST()
    const body = await res.json()
    expect(body.code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
  })
})
