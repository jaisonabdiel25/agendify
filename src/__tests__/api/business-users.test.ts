jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    business: {
      findUnique: jest.fn(),
    },
  },
}))
jest.mock("@/lib/plan-utils", () => ({
  checkActiveUserLimit: jest.fn(),
}))

import { GET } from "@/app/api/business/users/route"
import { PATCH } from "@/app/api/business/users/[id]/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkActiveUserLimit } from "@/lib/plan-utils"

const authMock = auth as jest.Mock
const userFindManyMock = prisma.user.findMany as jest.Mock
const userFindUniqueMock = prisma.user.findUnique as jest.Mock
const userCountMock = prisma.user.count as jest.Mock
const userUpdateMock = prisma.user.update as jest.Mock
const businessFindUniqueMock = prisma.business.findUnique as jest.Mock
const checkLimitMock = checkActiveUserLimit as jest.Mock

const ownerSession = {
  user: { id: "user-owner", businessId: "biz-1", role: "OWNER" },
  expires: "2099-12-31",
}

const staffSession = {
  user: { id: "user-staff", businessId: "biz-1", role: "STAFF" },
  expires: "2099-12-31",
}

const mockUsers = [
  { id: "user-owner", name: "Propietario", email: "owner@test.com", role: "OWNER", isActive: true, chair: null },
  { id: "user-staff", name: "Staff Uno", email: "staff@test.com", role: "STAFF", isActive: false, chair: { name: "Silla 1" } },
]

beforeEach(() => {
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────
// GET /api/business/users
// ─────────────────────────────────────────────
describe("GET /api/business/users", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retorna 403 si el rol es STAFF", async () => {
    authMock.mockResolvedValue(staffSession)
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it("retorna 200 con lista de usuarios y datos del plan", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindManyMock.mockResolvedValue(mockUsers)
    userCountMock.mockResolvedValue(1)
    businessFindUniqueMock.mockResolvedValue({ plan: { maxUsers: 3 } })

    const res = await GET()
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body.users).toHaveLength(2)
    expect(body.activeCount).toBe(1)
    expect(body.maxUsers).toBe(3)
  })

  it("incluye chairName en cada usuario", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindManyMock.mockResolvedValue(mockUsers)
    userCountMock.mockResolvedValue(1)
    businessFindUniqueMock.mockResolvedValue({ plan: { maxUsers: 3 } })

    const res = await GET()
    const body = await res.json()

    expect(body.users[0].chairName).toBeNull()
    expect(body.users[1].chairName).toBe("Silla 1")
  })

  it("retorna 500 si prisma lanza error", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindManyMock.mockRejectedValue(new Error("DB error"))

    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────
// PATCH /api/business/users/[id]
// ─────────────────────────────────────────────
function makePatchRequest(body: object) {
  return new Request("http://localhost/api/business/users/user-staff", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const mockParams = Promise.resolve({ id: "user-staff" })

describe("PATCH /api/business/users/[id]", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await PATCH(makePatchRequest({ isActive: true }), { params: mockParams })
    expect(res.status).toBe(401)
  })

  it("retorna 403 si el rol es STAFF", async () => {
    authMock.mockResolvedValue(staffSession)
    const res = await PATCH(makePatchRequest({ isActive: true }), { params: mockParams })
    expect(res.status).toBe(403)
  })

  it("retorna 400 con body inválido", async () => {
    authMock.mockResolvedValue(ownerSession)
    const req = new Request("http://localhost/api/business/users/user-staff", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: "not-boolean" }),
    })
    const res = await PATCH(req, { params: mockParams })
    expect(res.status).toBe(400)
  })

  it("retorna 404 si el usuario no pertenece al negocio", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindUniqueMock.mockResolvedValue({ id: "user-staff", businessId: "biz-otro", role: "STAFF" })

    const res = await PATCH(makePatchRequest({ isActive: true }), { params: mockParams })
    expect(res.status).toBe(404)
  })

  it("retorna 404 si el usuario no existe", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindUniqueMock.mockResolvedValue(null)

    const res = await PATCH(makePatchRequest({ isActive: false }), { params: mockParams })
    expect(res.status).toBe(404)
  })

  it("retorna 400 si el OWNER intenta desactivarse a sí mismo", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindUniqueMock.mockResolvedValue({ id: "user-owner", businessId: "biz-1", role: "OWNER" })

    const params = Promise.resolve({ id: "user-owner" })
    const res = await PATCH(makePatchRequest({ isActive: false }), { params })
    expect(res.status).toBe(400)
  })

  it("retorna 409 si activar excede el límite del plan", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindUniqueMock.mockResolvedValue({ id: "user-staff", businessId: "biz-1", role: "STAFF" })
    checkLimitMock.mockResolvedValue({ allowed: false, message: "Límite alcanzado" })

    const res = await PATCH(makePatchRequest({ isActive: true }), { params: mockParams })
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe("Límite alcanzado")
  })

  it("retorna 200 al activar un usuario dentro del límite", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindUniqueMock.mockResolvedValue({ id: "user-staff", businessId: "biz-1", role: "STAFF" })
    checkLimitMock.mockResolvedValue({ allowed: true })
    userUpdateMock.mockResolvedValue({ id: "user-staff", name: "Staff Uno", email: "staff@test.com", role: "STAFF", isActive: true })

    const res = await PATCH(makePatchRequest({ isActive: true }), { params: mockParams })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.isActive).toBe(true)
  })

  it("retorna 200 al desactivar un usuario sin verificar límite", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindUniqueMock.mockResolvedValue({ id: "user-staff", businessId: "biz-1", role: "STAFF" })
    userUpdateMock.mockResolvedValue({ id: "user-staff", name: "Staff Uno", email: "staff@test.com", role: "STAFF", isActive: false })

    const res = await PATCH(makePatchRequest({ isActive: false }), { params: mockParams })
    expect(res.status).toBe(200)
    expect(checkLimitMock).not.toHaveBeenCalled()
  })

  it("retorna 500 si prisma lanza error", async () => {
    authMock.mockResolvedValue(ownerSession)
    userFindUniqueMock.mockRejectedValue(new Error("DB error"))

    const res = await PATCH(makePatchRequest({ isActive: true }), { params: mockParams })
    expect(res.status).toBe(500)
  })
})
