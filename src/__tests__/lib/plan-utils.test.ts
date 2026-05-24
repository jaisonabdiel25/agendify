jest.mock("@/lib/prisma", () => ({
  prisma: {
    business: { findUnique: jest.fn() },
    service: { count: jest.fn() },
    chair: { count: jest.fn() },
    user: { count: jest.fn() },
  },
}))

import { checkServiceLimit, checkChairLimit, checkInviteAllowed, checkActiveUserLimit } from "@/lib/plan-utils"
import { prisma } from "@/lib/prisma"

const STANDARD_PLAN = {
  name: "Estándar",
  maxServices: 1,
  maxChairs: 1,
  maxUsers: 1,
  canInvite: false,
}

const PRO_PLAN = {
  name: "Pro",
  maxServices: 2,
  maxChairs: 3,
  maxUsers: 3,
  canInvite: true,
}

function mockPlan(plan: typeof STANDARD_PLAN | typeof PRO_PLAN | null) {
  jest.mocked(prisma.business.findUnique).mockResolvedValue(
    plan === null
      ? null
      : ({ plan } as unknown as Awaited<ReturnType<typeof prisma.business.findUnique>>)
  )
}

beforeEach(() => jest.clearAllMocks())

// ─── checkServiceLimit ────────────────────────────────────────────────────────

describe("checkServiceLimit", () => {
  it("retorna not allowed cuando el negocio no tiene plan", async () => {
    mockPlan(null)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/sin plan/i)
  })

  it("retorna allowed cuando está por debajo del límite (STANDARD)", async () => {
    mockPlan(STANDARD_PLAN)
    jest.mocked(prisma.service.count).mockResolvedValue(0)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (STANDARD: 1)", async () => {
    mockPlan(STANDARD_PLAN)
    jest.mocked(prisma.service.count).mockResolvedValue(1)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/Estándar/i)
    expect(result.message).toMatch(/1 servicio/)
  })

  it("retorna allowed cuando está por debajo del límite (PRO)", async () => {
    mockPlan(PRO_PLAN)
    jest.mocked(prisma.service.count).mockResolvedValue(1)
    const result = await checkServiceLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (PRO: 2)", async () => {
    mockPlan(PRO_PLAN)
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
    mockPlan(null)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/sin plan/i)
  })

  it("retorna allowed cuando está por debajo del límite (STANDARD)", async () => {
    mockPlan(STANDARD_PLAN)
    jest.mocked(prisma.chair.count).mockResolvedValue(0)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (STANDARD: 1 puesto)", async () => {
    mockPlan(STANDARD_PLAN)
    jest.mocked(prisma.chair.count).mockResolvedValue(1)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/1 puesto/)
  })

  it("retorna allowed cuando está por debajo del límite (PRO)", async () => {
    mockPlan(PRO_PLAN)
    jest.mocked(prisma.chair.count).mockResolvedValue(2)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (PRO: 3 puestos)", async () => {
    mockPlan(PRO_PLAN)
    jest.mocked(prisma.chair.count).mockResolvedValue(3)
    const result = await checkChairLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/3 puestos/)
  })
})

// ─── checkInviteAllowed ───────────────────────────────────────────────────────

describe("checkInviteAllowed", () => {
  it("retorna not allowed cuando el negocio no tiene plan", async () => {
    mockPlan(null)
    const result = await checkInviteAllowed("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/sin plan/i)
  })

  it("retorna not allowed para plan STANDARD (no permite invitaciones)", async () => {
    mockPlan(STANDARD_PLAN)
    const result = await checkInviteAllowed("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/Estándar/i)
  })

  it("retorna allowed para PRO con cupo disponible", async () => {
    mockPlan(PRO_PLAN)
    jest.mocked(prisma.user.count).mockResolvedValue(1)
    const result = await checkInviteAllowed("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed para PRO cuando se alcanzó el límite de usuarios", async () => {
    mockPlan(PRO_PLAN)
    jest.mocked(prisma.user.count).mockResolvedValue(3)
    const result = await checkInviteAllowed("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/3 usuarios/)
  })
})

// ─── checkActiveUserLimit ─────────────────────────────────────────────────────

describe("checkActiveUserLimit", () => {
  it("retorna not allowed cuando el negocio no tiene plan", async () => {
    mockPlan(null)
    const result = await checkActiveUserLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/sin plan/i)
  })

  it("retorna allowed cuando hay cupo para más usuarios activos (STANDARD)", async () => {
    mockPlan(STANDARD_PLAN)
    jest.mocked(prisma.user.count).mockResolvedValue(0)
    const result = await checkActiveUserLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando se alcanzó el límite activo (STANDARD: 1)", async () => {
    mockPlan(STANDARD_PLAN)
    jest.mocked(prisma.user.count).mockResolvedValue(1)
    const result = await checkActiveUserLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/Estándar/i)
    expect(result.message).toMatch(/1 usuario activo/)
  })

  it("retorna allowed cuando está por debajo del límite (PRO)", async () => {
    mockPlan(PRO_PLAN)
    jest.mocked(prisma.user.count).mockResolvedValue(2)
    const result = await checkActiveUserLimit("biz-1")
    expect(result.allowed).toBe(true)
  })

  it("retorna not allowed cuando alcanza el límite (PRO: 3 usuarios activos)", async () => {
    mockPlan(PRO_PLAN)
    jest.mocked(prisma.user.count).mockResolvedValue(3)
    const result = await checkActiveUserLimit("biz-1")
    expect(result.allowed).toBe(false)
    expect(result.message).toMatch(/Pro/i)
    expect(result.message).toMatch(/3 usuarios activos/)
  })
})
