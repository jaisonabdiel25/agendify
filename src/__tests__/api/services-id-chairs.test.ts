jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("@/lib/prisma", () => ({
  prisma: {
    service: { findFirst: jest.fn() },
    chairService: { findMany: jest.fn(), deleteMany: jest.fn(), createMany: jest.fn() },
    chair: { findMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

import { GET, PUT } from "@/app/api/services/[id]/chairs/route"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const authMock = auth as jest.Mock

const mockOwnerSession = {
  user: { id: "user-1", businessId: "biz-1", role: "OWNER" },
  expires: "2099-12-31",
}
const mockStaffSession = {
  user: { id: "user-3", businessId: "biz-1", role: "STAFF" },
  expires: "2099-12-31",
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(prisma.$transaction as jest.Mock).mockResolvedValue([])
})

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) }
}

function makePutRequest(body: unknown) {
  return new Request("http://localhost/api/services/s1/chairs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

// ─── GET ──────────────────────────────────────────────────────────────────────

describe("GET /api/services/[id]/chairs — autenticación", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await GET(new Request("http://localhost"), makeParams("s1"))
    expect(res.status).toBe(401)
  })

  it("retorna 401 para rol STAFF", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const res = await GET(new Request("http://localhost"), makeParams("s1"))
    expect(res.status).toBe(401)
  })
})

describe("GET /api/services/[id]/chairs — recurso", () => {
  it("retorna 404 cuando el servicio no existe en el negocio", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await GET(new Request("http://localhost"), makeParams("s99"))
    expect(res.status).toBe(404)
  })

  it("retorna 200 con array de chairIds asignados", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: "s1" })
    ;(prisma.chairService.findMany as jest.Mock).mockResolvedValue([
      { chairId: "c1" },
      { chairId: "c2" },
    ])
    const res = await GET(new Request("http://localhost"), makeParams("s1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual(["c1", "c2"])
  })

  it("retorna array vacío cuando el servicio no tiene puestos asignados", async () => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: "s1" })
    ;(prisma.chairService.findMany as jest.Mock).mockResolvedValue([])
    const res = await GET(new Request("http://localhost"), makeParams("s1"))
    const body = await res.json()
    expect(body).toEqual([])
  })
})

// ─── PUT ──────────────────────────────────────────────────────────────────────

describe("PUT /api/services/[id]/chairs — autenticación", () => {
  it("retorna 401 sin sesión", async () => {
    authMock.mockResolvedValue(null)
    const res = await PUT(makePutRequest({ chairIds: [] }), makeParams("s1"))
    expect(res.status).toBe(401)
  })

  it("retorna 401 para rol STAFF", async () => {
    authMock.mockResolvedValue(mockStaffSession)
    const res = await PUT(makePutRequest({ chairIds: [] }), makeParams("s1"))
    expect(res.status).toBe(401)
  })
})

describe("PUT /api/services/[id]/chairs — validación", () => {
  beforeEach(() => authMock.mockResolvedValue(mockOwnerSession))

  it("retorna 404 cuando el servicio no existe", async () => {
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue(null)
    const res = await PUT(makePutRequest({ chairIds: [] }), makeParams("s99"))
    expect(res.status).toBe(404)
  })

  it("retorna 400 con body no JSON", async () => {
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: "s1" })
    const req = new Request("http://localhost/api/services/s1/chairs", {
      method: "PUT",
      body: "no-json",
    })
    const res = await PUT(req, makeParams("s1"))
    expect(res.status).toBe(400)
  })

  it("retorna 400 cuando chairIds no es array", async () => {
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: "s1" })
    const res = await PUT(makePutRequest({ chairIds: "no-array" }), makeParams("s1"))
    expect(res.status).toBe(400)
  })

  it("retorna 400 cuando un chairId no pertenece al negocio", async () => {
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: "s1" })
    ;(prisma.chair.findMany as jest.Mock).mockResolvedValue([])
    const res = await PUT(makePutRequest({ chairIds: ["c-extraño"] }), makeParams("s1"))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/válidos/i)
  })
})

describe("PUT /api/services/[id]/chairs — actualización exitosa", () => {
  beforeEach(() => {
    authMock.mockResolvedValue(mockOwnerSession)
    ;(prisma.service.findFirst as jest.Mock).mockResolvedValue({ id: "s1" })
  })

  it("retorna 200 con { ok: true } al asignar puestos válidos", async () => {
    ;(prisma.chair.findMany as jest.Mock).mockResolvedValue([{ id: "c1" }])
    const res = await PUT(makePutRequest({ chairIds: ["c1"] }), makeParams("s1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("retorna 200 al desasignar todos los puestos (chairIds vacío)", async () => {
    const res = await PUT(makePutRequest({ chairIds: [] }), makeParams("s1"))
    expect(res.status).toBe(200)
    expect(body => body.ok).toBeTruthy()
  })

  it("no valida chairIds cuando el array está vacío", async () => {
    await PUT(makePutRequest({ chairIds: [] }), makeParams("s1"))
    expect(prisma.chair.findMany).not.toHaveBeenCalled()
  })
})
