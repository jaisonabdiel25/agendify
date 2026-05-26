jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: { findMany: jest.fn() },
    chair: { findMany: jest.fn() },
    chairService: { findMany: jest.fn() },
  },
}))

import { GET as getBusinesses } from "@/app/api/public/businesses/route"
import { GET as getChairs } from "@/app/api/public/chairs/route"
import { GET as getServices } from "@/app/api/public/services/route"
import { prisma } from "@/lib/prisma"

beforeEach(() => {
  jest.clearAllMocks()
})

function makeRequest(q?: string) {
  const url = q
    ? `http://localhost/api/public/businesses?q=${encodeURIComponent(q)}`
    : "http://localhost/api/public/businesses"
  return new Request(url)
}

// ─── GET /api/public/businesses ───────────────────────────────────────────────

describe("GET /api/public/businesses", () => {
  it("retorna 200 con lista de negocios activos", async () => {
    ;(prisma.business.findMany as jest.Mock).mockResolvedValue([
      { id: "biz-1", name: "Peluquería A", slug: "peluqueria-a", address: null },
    ])
    const res = await getBusinesses(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe("Peluquería A")
  })

  it("retorna array vacío cuando no hay negocios activos", async () => {
    ;(prisma.business.findMany as jest.Mock).mockResolvedValue([])
    const res = await getBusinesses(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })

  it("filtra solo negocios con isActive: true cuando no hay query", async () => {
    ;(prisma.business.findMany as jest.Mock).mockResolvedValue([])
    await getBusinesses(makeRequest())
    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    )
  })

  it("ordena los negocios por nombre ascendente", async () => {
    ;(prisma.business.findMany as jest.Mock).mockResolvedValue([])
    await getBusinesses(makeRequest())
    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { name: "asc" } })
    )
  })

  it("filtra por nombre cuando se pasa ?q=", async () => {
    ;(prisma.business.findMany as jest.Mock).mockResolvedValue([
      { id: "biz-2", name: "Barbería Norte", slug: "barberia-norte", address: null },
    ])
    const res = await getBusinesses(makeRequest("Barbería"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body[0].name).toBe("Barbería Norte")
    expect(prisma.business.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          name: { contains: "Barbería", mode: "insensitive" },
        },
      })
    )
  })

  it("retorna array vacío cuando ?q= no encuentra coincidencias", async () => {
    ;(prisma.business.findMany as jest.Mock).mockResolvedValue([])
    const res = await getBusinesses(makeRequest("xyzinexistente"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual([])
  })
})

// ─── GET /api/public/chairs ───────────────────────────────────────────────────

describe("GET /api/public/chairs — validación", () => {
  it("retorna 400 sin businessId", async () => {
    const req = new Request("http://localhost/api/public/chairs")
    const res = await getChairs(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/businessId/i)
  })
})

describe("GET /api/public/chairs — lógica", () => {
  it("retorna 200 con los puestos activos del negocio", async () => {
    ;(prisma.chair.findMany as jest.Mock).mockResolvedValue([
      { id: "c1", name: "Silla A", description: null, avatarUrl: null },
    ])
    const req = new Request("http://localhost/api/public/chairs?businessId=biz-1")
    const res = await getChairs(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe("Silla A")
  })

  it("filtra puestos activos con usuario asignado del businessId correcto", async () => {
    ;(prisma.chair.findMany as jest.Mock).mockResolvedValue([])
    const req = new Request("http://localhost/api/public/chairs?businessId=biz-1")
    await getChairs(req)
    expect(prisma.chair.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId: "biz-1", isActive: true, NOT: { userId: null } },
      })
    )
  })

  it("no retorna puestos sin usuario asignado", async () => {
    ;(prisma.chair.findMany as jest.Mock).mockResolvedValue([
      { id: "c2", name: "Silla B", description: null, avatarUrl: null },
    ])
    const req = new Request("http://localhost/api/public/chairs?businessId=biz-1")
    const res = await getChairs(req)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].id).toBe("c2")
  })

  it("retorna array vacío cuando no hay puestos activos", async () => {
    ;(prisma.chair.findMany as jest.Mock).mockResolvedValue([])
    const req = new Request("http://localhost/api/public/chairs?businessId=biz-sin-puestos")
    const res = await getChairs(req)
    const body = await res.json()
    expect(body).toEqual([])
  })
})

// ─── GET /api/public/services ─────────────────────────────────────────────────

describe("GET /api/public/services — validación", () => {
  it("retorna 400 sin chairId", async () => {
    const req = new Request("http://localhost/api/public/services")
    const res = await getServices(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/chairId/i)
  })
})

describe("GET /api/public/services — lógica", () => {
  it("retorna 200 con servicios activos del puesto", async () => {
    ;(prisma.chairService.findMany as jest.Mock).mockResolvedValue([
      {
        chairId: "c1",
        serviceId: "s1",
        service: {
          id: "s1",
          name: "Corte",
          durationMinutes: 30,
          price: "25.00",
          color: "#6366f1",
          isActive: true,
        },
      },
    ])
    const req = new Request("http://localhost/api/public/services?chairId=c1")
    const res = await getServices(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].name).toBe("Corte")
  })

  it("excluye servicios inactivos del resultado", async () => {
    ;(prisma.chairService.findMany as jest.Mock).mockResolvedValue([
      {
        chairId: "c1",
        serviceId: "s2",
        service: {
          id: "s2",
          name: "Tinte",
          durationMinutes: 60,
          price: "50.00",
          color: "#10b981",
          isActive: false,
        },
      },
    ])
    const req = new Request("http://localhost/api/public/services?chairId=c1")
    const res = await getServices(req)
    const body = await res.json()
    expect(body).toHaveLength(0)
  })

  it("retorna array vacío cuando el puesto no tiene servicios", async () => {
    ;(prisma.chairService.findMany as jest.Mock).mockResolvedValue([])
    const req = new Request("http://localhost/api/public/services?chairId=c-vacio")
    const res = await getServices(req)
    const body = await res.json()
    expect(body).toEqual([])
  })

  it("incluye los campos necesarios para cada servicio", async () => {
    ;(prisma.chairService.findMany as jest.Mock).mockResolvedValue([
      {
        chairId: "c1",
        serviceId: "s1",
        service: {
          id: "s1",
          name: "Corte",
          durationMinutes: 30,
          price: "25.00",
          color: "#6366f1",
          isActive: true,
        },
      },
    ])
    const req = new Request("http://localhost/api/public/services?chairId=c1")
    const res = await getServices(req)
    const body = await res.json()
    const svc = body[0]
    expect(svc).toHaveProperty("id")
    expect(svc).toHaveProperty("name")
    expect(svc).toHaveProperty("durationMinutes")
    expect(svc).toHaveProperty("price")
    expect(svc).toHaveProperty("color")
  })
})
