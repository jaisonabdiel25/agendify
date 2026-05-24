jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: { findUnique: jest.fn() },
    service: { count: jest.fn() },
    chair: { count: jest.fn() },
    user: { count: jest.fn() },
  },
}))

import { checkServiceLimit, checkChairLimit, checkInviteAllowed } from "@/lib/plan-utils"
import { prisma } from "@/lib/prisma"

function mockPlanType(type: "STANDARD" | "PRO" | null) {
  jest.mocked(prisma.business.findUnique).mockResolvedValue(
    type === null
      ? null
      : ({ plan: { type } } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
  )
}

beforeEach(() => jest.clearAllMocks())

// ─── checkServiceLimit ────────────────────────────────────────────────────────

describe("checkServiceLimit", () => {
  it("retorna not allowed cuando el negocio no tiene plan", async () => {
    mockPlanType(null)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/sin plan/i)
  })

  it("retorna allowed cuando está por debajo del límite (STANDARD)", async () => {
    mockPlanType("STANDARD")
    jest.mocked(prisma.service.count).mockResolvedValue(0)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (STANDARD: 1)", async () => {
    mockPlanType("STANDARD")
    jest.mocked(prisma.service.count).mockResolvedValue(1)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/Estándar/i)
    expect(result.message).toMatch(/1 servicio/)
  })

  it("retorna allowed cuando está por debajo del límite (PRO)", async () => {
    mockPlanType("PRO")
    jest.mocked(prisma.service.count).mockResolvedValue(1)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (PRO: 2)", async () => {
    mockPlanType("PRO")
    jest.mocked(prisma.service.count).mockResolvedValue(2)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/Pro/i)
    expect(result.message).toMatch(/2 servicios/)
  })
})

// ─── checkChairLimit ──────────────────────────────────────────────────────────

describe("checkChairLimit", () => {
  it("retorna not allowed cuando el negocio no tiene plan", async () => {
    mockPlanType(null)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/sin plan/i)
  })

  it("retorna allowed cuando está por debajo del límite (STANDARD)", async () => {
    mockPlanType("STANDARD")
    jest.mocked(prisma.chair.count).mockResolvedValue(0)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (STANDARD: 1 puesto)", async () => {
    mockPlanType("STANDARD")
    jest.mocked(prisma.chair.count).mockResolvedValue(1)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/1 puesto/)
  })

  it("retorna allowed cuando está por debajo del límite (PRO)", async () => {
    mockPlanType("PRO")
    jest.mocked(prisma.chair.count).mockResolvedValue(2)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (PRO: 3 puestos)", async () => {
    mockPlanType("PRO")
    jest.mocked(prisma.chair.count).mockResolvedValue(3)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/3 puestos/)
  })
})

// ─── checkInviteAllowed ───────────────────────────────────────────────────────

describe("checkInviteAllowed", () => {
  it("retorna not allowed cuando el negocio no tiene plan", async () => {
    mockPlanType(null)
    const result = await checkInviteAllowed("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/sin plan/i)
  })

  it("retorna not allowed para plan STANDARD (no permite invitaciones)", async () => {
    mockPlanType("STANDARD")
    const result = await checkInviteAllowed("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/Estándar/i)
  })

  it("retorna allowed para PRO con cupo disponible", async () => {
    mockPlanType("PRO")
    jest.mocked(prisma.user.count).mockResolvedValue(1)
    const result = await checkInviteAllowed("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed para PRO cuando se alcanzó el límite de usuarios", async () => {
    mockPlanType("PRO")
    jest.mocked(prisma.user.count).mockResolvedValue(3)
    const result = await checkInviteAllowed("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/3 usuarios/)
  })
})
