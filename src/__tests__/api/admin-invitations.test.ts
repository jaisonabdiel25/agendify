jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: { findUnique: jest.fn() },
    invitation: { findUnique: jest.fn(), create: jest.fn() },
    user: { count: jest.fn() },
  },
}))

import { POST } from "@/app/api/admin/invitations/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockAdminSession = {
  user: { id: "admin-1", role: "ADMIN" },
  expires: "2099-12-31",
}

const mockProBusiness = { id: "biz-1", plan: { name: "Pro", maxServices: 2, maxChairs: 3, maxUsers: 3, canInvite: true } }
const mockStandardBusiness = { plan: { name: "Estándar", maxServices: 1, maxChairs: 1, maxUsers: 1, canInvite: false } }

beforeEach(() => {
  jest.clearAllMocks()
})

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/admin/invitations — autorización", () => {
  it("retorna 403 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makeRequest({ businessId: "biz-1" }))
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol OWNER", async () => {
    authMock.mockResolvedValue({ user: { role: "OWNER" } })
    const res = await POST(makeRequest({ businessId: "biz-1" }))
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol STAFF", async () => {
    authMock.mockResolvedValue({ user: { role: "STAFF" } })
    const res = await POST(makeRequest({ businessId: "biz-1" }))
    expect(res.status).toBe(403)
  })
})

describe("POST /api/admin/invitations — validación", () => {
  beforeEach(() => authMock.mockResolvedValue(mockAdminSession))

  it("retorna 400 sin businessId", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con businessId vacío", async () => {
    const res = await POST(makeRequest({ businessId: "" }))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/admin/invitations — lógica de negocio", () => {
  beforeEach(() => authMock.mockResolvedValue(mockAdminSession))

  it("retorna 404 cuando el negocio no existe", async () => {
    jest.mocked(prisma.business.findUnique).mockResolvedValue(null)
    const res = await POST(makeRequest({ businessId: "biz-99" }))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/no encontrado/i)
  })

  it("retorna 403 cuando el negocio tiene plan STANDARD", async () => {
    jest.mocked(prisma.business.findUnique)
      .mockResolvedValueOnce({ id: "biz-1" } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
      .mockResolvedValueOnce(mockStandardBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
    const res = await POST(makeRequest({ businessId: "biz-1" }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("Estándar")
  })

  it("retorna 403 cuando el negocio PRO ya tiene 3 usuarios", async () => {
    jest.mocked(prisma.business.findUnique)
      .mockResolvedValueOnce({ id: "biz-1" } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
      .mockResolvedValueOnce(mockProBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
    jest.mocked(prisma.user.count).mockResolvedValue(3)
    const res = await POST(makeRequest({ businessId: "biz-1" }))
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain("Pro")
  })

  it("retorna 201 con la invitación creada", async () => {
    jest.mocked(prisma.business.findUnique)
      .mockResolvedValueOnce({ id: "biz-1" } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
      .mockResolvedValueOnce(mockProBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
    jest.mocked(prisma.user.count).mockResolvedValue(1)
    jest.mocked(prisma.invitation.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.invitation.create).mockResolvedValue({
      id: "inv-1",
      code: "ABCD-1234",
      businessId: "biz-1",
      createdById: "admin-1",
    } as unknown as Awaited<ReturnType<typeof prisma.invitation.create>>)
    const res = await POST(makeRequest({ businessId: "biz-1" }))
    expect(res.status).toBe(201)
  })

  it("genera un nuevo código si el primero ya está en uso", async () => {
    jest.mocked(prisma.business.findUnique)
      .mockResolvedValueOnce({ id: "biz-1" } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
      .mockResolvedValueOnce(mockProBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
    jest.mocked(prisma.user.count).mockResolvedValue(1)
    jest.mocked(prisma.invitation.findUnique)
      .mockResolvedValueOnce({ id: "existing-inv" } as unknown as Awaited<ReturnType<typeof prisma.invitation.findUnique>>)
      .mockResolvedValueOnce(null)
    jest.mocked(prisma.invitation.create).mockResolvedValue({
      id: "inv-2",
      code: "WXYZ-5678",
    } as unknown as Awaited<ReturnType<typeof prisma.invitation.create>>)
    const res = await POST(makeRequest({ businessId: "biz-1" }))
    expect(res.status).toBe(201)
    expect(prisma.invitation.findUnique).toHaveBeenCalledTimes(2)
  })

  it("asocia la invitación al businessId y al creador", async () => {
    jest.mocked(prisma.business.findUnique)
      .mockResolvedValueOnce({ id: "biz-1" } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
      .mockResolvedValueOnce(mockProBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
    jest.mocked(prisma.user.count).mockResolvedValue(1)
    jest.mocked(prisma.invitation.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.invitation.create).mockResolvedValue({ id: "inv-1", code: "ABCD-1234" } as unknown as Awaited<ReturnType<typeof prisma.invitation.create>>)
    await POST(makeRequest({ businessId: "biz-1" }))
    expect(prisma.invitation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ businessId: "biz-1", createdById: "admin-1" }),
      })
    )
  })
})
