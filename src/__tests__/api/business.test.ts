jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: { update: jest.fn() },
  },
}))

import { PATCH } from "@/app/api/business/route"
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

const validBody = {
  name: "Mi Peluquería",
  timezone: "America/Panama",
}

const mockBusiness = {
  id: "biz-1",
  name: "Mi Peluquería",
  slug: "mi-peluqueria",
  phone: null,
  email: null,
  timezone: "America/Panama",
  address: null,
}

beforeEach(() => {
  jest.clearAllMocks()
})

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/business", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("PATCH /api/business — autorización", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await PATCH(makeRequest(validBody))
    expect(res.status).toBe(401)
  })

  it("retorna 403 para rol STAFF", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const res = await PATCH(makeRequest(validBody))
    expect(res.status).toBe(403)
  })

  it("permite PATCH al rol ADMIN", async () => {
    authMock.mockResolvedValue(mockAdminSession)
    ;(prisma.business.update as jest.Mock).mockResolvedValue(mockBusiness)
    const res = await PATCH(makeRequest(validBody))
    expect(res.status).toBe(200)
  })
})

describe("PATCH /api/business — validación", () => {
  beforeEach(() => authMock.mockResolvedValue(mockOwnerSession))

  it("retorna 400 con body no parseable como JSON", async () => {
    const req = new Request("http://localhost/api/business", {
      method: "PATCH",
      body: "no-json",
    })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin nombre", async () => {
    const res = await PATCH(makeRequest({ timezone: "America/Panama" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con nombre de 1 carácter", async () => {
    const res = await PATCH(makeRequest({ name: "A", timezone: "America/Panama" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin timezone", async () => {
    const res = await PATCH(makeRequest({ name: "Mi Negocio" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con email inválido", async () => {
    const res = await PATCH(makeRequest({ ...validBody, email: "no-email" }))
    expect(res.status).toBe(400)
  })
})

describe("PATCH /api/business — actualización exitosa", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.business.update as jest.Mock).mockResolvedValue(mockBusiness)
  })

  it("retorna 200 con los datos actualizados", async () => {
    const res = await PATCH(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.name).toBe("Mi Peluquería")
  })

  it("acepta email vacío (string vacío es válido)", async () => {
    const res = await PATCH(makeRequest({ ...validBody, email: "" }))
    expect(res.status).toBe(200)
  })

  it("actualiza solo el negocio del businessId de sesión", async () => {
    await PATCH(makeRequest(validBody))
    expect(prisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "biz-1" } })
    )
  })

  it("guarda phone como null cuando no se envía", async () => {
    await PATCH(makeRequest(validBody))
    expect(prisma.business.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ phone: null }),
      })
    )
  })
})
