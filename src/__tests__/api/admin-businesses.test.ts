jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { POST } from "@/app/api/admin/businesses/route"
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

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/admin/businesses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/admin/businesses — autorización", () => {
  it("retorna 403 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await POST(makeRequest({ name: "Mi Negocio" }))
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol OWNER (solo ADMIN puede crear)", async () => {
    authMock.mockResolvedValue({ user: { role: "OWNER" } })
    const res = await POST(makeRequest({ name: "Mi Negocio" }))
    expect(res.status).toBe(403)
  })

  it("retorna 403 para rol STAFF", async () => {
    authMock.mockResolvedValue({ user: { role: "STAFF" } })
    const res = await POST(makeRequest({ name: "Mi Negocio" }))
    expect(res.status).toBe(403)
  })
})

describe("POST /api/admin/businesses — validación de datos", () => {
  beforeEach(() => authMock.mockResolvedValue(mockAdminSession))

  it("retorna 400 con nombre de 1 carácter", async () => {
    const res = await POST(makeRequest({ name: "A" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin nombre", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con body vacío", async () => {
    const res = await POST(makeRequest(""))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/admin/businesses — creación exitosa", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.business.findUnique as jest.Mock).mockResolvedValue(null)
    ;(prisma.business.create as jest.Mock).mockResolvedValue({
      id: "biz-1",
      name: "Barberia Centro",
      slug: "barberia-centro",
    })
  })

  it("retorna 201 al crear un negocio válido", async () => {
    const res = await POST(makeRequest({ name: "Barberia Centro" }))
    expect(res.status).toBe(201)
  })

  it("genera un slug en minúsculas sin espacios", async () => {
    await POST(makeRequest({ name: "Barberia Centro" }))
    expect(prisma.business.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "barberia-centro" }),
      })
    )
  })

  it("intenta slug alternativo si el slug ya existe", async () => {
    ;(prisma.business.findUnique as jest.Mock)
      .mockResolvedValueOnce({ id: "existing" })
      .mockResolvedValueOnce(null)
    await POST(makeRequest({ name: "Barberia Centro" }))
    expect(prisma.business.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ slug: "barberia-centro-1" }),
      })
    )
  })

  it("guarda el nombre correcto en la base de datos", async () => {
    await POST(makeRequest({ name: "Barberia Centro" }))
    expect(prisma.business.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ name: "Barberia Centro" }),
      })
    )
  })
})
