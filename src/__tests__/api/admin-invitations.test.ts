jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: { findUnique: jest.fn() },
    invitation: { findUnique: jest.fn(), create: jest.fn() },
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

const mockBusiness = { id: "biz-1" }
const mockStandardBusiness = { id: "biz-2" }
const mockFullBusiness = { id: "biz-3" }

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

  it("retorna 201 aunque el negocio tenga plan Estándar (sin restricción para admin)", async () => {
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockStandardBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.invitation.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.invitation.create).mockResolvedValue({
      id: "inv-1",
      code: "ABCD-1234",
      businessId: "biz-2",
      createdById: "admin-1",
    } as unknown as Awaited<ReturnType<typeof prisma.invitation.create>>)
    const res = await POST(makeRequest({ businessId: "biz-2" }))
    expect(res.status).toBe(201)
  })

  it("retorna 201 aunque el negocio haya alcanzado el límite de usuarios (sin restricción para admin)", async () => {
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockFullBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
    jest.mocked(prisma.invitation.findUnique).mockResolvedValue(null)
    jest.mocked(prisma.invitation.create).mockResolvedValue({
      id: "inv-1",
      code: "ABCD-1234",
      businessId: "biz-3",
      createdById: "admin-1",
    } as unknown as Awaited<ReturnType<typeof prisma.invitation.create>>)
    const res = await POST(makeRequest({ businessId: "biz-3" }))
    expect(res.status).toBe(201)
  })

  it("retorna 201 con la invitación creada", async () => {
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
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
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
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
    jest.mocked(prisma.business.findUnique).mockResolvedValue(
      mockBusiness as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>
    )
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
