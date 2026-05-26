import { prisma } from "@/lib/prisma"

interface LimitResult {
  allowed: boolean
  message?: string
}

interface PlanLimits {
  name: string
  maxServices: number
  maxChairs: number
  maxUsers: number
  canInvite: boolean
}

async function getBusinessPlan(businessId: string): Promise<PlanLimits | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      plan: {
        select: {
          name: true,
          maxServices: true,
          maxChairs: true,
          maxUsers: true,
          canInvite: true,
        },
      },
    },
  })
  return business?.plan ?? null
}

export async function checkServiceLimit(businessId: string): Promise<LimitResult> {
  const plan = await getBusinessPlan(businessId)
  if (!plan) return { allowed: false, message: "Negocio sin plan asignado" }

  const count = await prisma.service.count({ where: { businessId, isActive: true } })

  if (count >= plan.maxServices) {
    return {
      allowed: false,
      message: `Tu plan ${plan.name} permite hasta ${plan.maxServices} ${plan.maxServices === 1 ? "servicio" : "servicios"}`,
    }
  }
  return { allowed: true }
}

export async function checkChairLimit(businessId: string): Promise<LimitResult> {
  const plan = await getBusinessPlan(businessId)
  if (!plan) return { allowed: false, message: "Negocio sin plan asignado" }

  const count = await prisma.chair.count({ where: { businessId, isActive: true } })

  if (count >= plan.maxChairs) {
    return {
      allowed: false,
      message: `Tu plan ${plan.name} permite hasta ${plan.maxChairs} ${plan.maxChairs === 1 ? "puesto" : "puestos"}`,
    }
  }
  return { allowed: true }
}

export async function checkActiveUserLimit(businessId: string): Promise<LimitResult> {
  const plan = await getBusinessPlan(businessId)
  if (!plan) return { allowed: false, message: "Negocio sin plan asignado" }

  const activeCount = await prisma.user.count({ where: { businessId, isActive: true, isDeleted: false } })
  if (activeCount >= plan.maxUsers) {
    return {
      allowed: false,
      message: `Tu plan ${plan.name} permite hasta ${plan.maxUsers} ${plan.maxUsers === 1 ? "usuario activo" : "usuarios activos"}`,
    }
  }
  return { allowed: true }
}

export async function checkInviteAllowed(businessId: string): Promise<LimitResult> {
  const plan = await getBusinessPlan(businessId)
  if (!plan) return { allowed: false, message: "Negocio sin plan asignado" }

  if (!plan.canInvite) {
    return {
      allowed: false,
      message: `Tu plan ${plan.name} no permite generar invitaciones`,
    }
  }

  const userCount = await prisma.user.count({ where: { businessId, isDeleted: false } })
  if (userCount >= plan.maxUsers) {
    return {
      allowed: false,
      message: `Tu plan ${plan.name} permite hasta ${plan.maxUsers} usuarios en el negocio`,
    }
  }

  return { allowed: true }
}
