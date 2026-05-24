import { PlanType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { PLAN_LIMITS } from "@/constant"

interface LimitResult {
  allowed: boolean
  message?: string
}

async function getBusinessPlanType(businessId: string): Promise<PlanType | null> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { plan: { select: { type: true } } },
  })
  return business?.plan?.type ?? null
}

export async function checkServiceLimit(businessId: string): Promise<LimitResult> {
  const planType = await getBusinessPlanType(businessId)
  if (!planType) return { allowed: false, message: "Negocio sin plan asignado" }

  const limit = PLAN_LIMITS[planType].maxServices
  const count = await prisma.service.count({ where: { businessId, isActive: true } })

  if (count >= limit) {
    return {
      allowed: false,
      message: `Tu plan ${planType === "STANDARD" ? "Estándar" : "Pro"} permite hasta ${limit} ${limit === 1 ? "servicio" : "servicios"}`,
    }
  }
  return { allowed: true }
}

export async function checkChairLimit(businessId: string): Promise<LimitResult> {
  const planType = await getBusinessPlanType(businessId)
  if (!planType) return { allowed: false, message: "Negocio sin plan asignado" }

  const limit = PLAN_LIMITS[planType].maxChairs
  const count = await prisma.chair.count({ where: { businessId, isActive: true } })

  if (count >= limit) {
    return {
      allowed: false,
      message: `Tu plan ${planType === "STANDARD" ? "Estándar" : "Pro"} permite hasta ${limit} ${limit === 1 ? "puesto" : "puestos"}`,
    }
  }
  return { allowed: true }
}

export async function checkInviteAllowed(businessId: string): Promise<LimitResult> {
  const planType = await getBusinessPlanType(businessId)
  if (!planType) return { allowed: false, message: "Negocio sin plan asignado" }

  const limits = PLAN_LIMITS[planType]

  if (!limits.canInvite) {
    return {
      allowed: false,
      message: "Tu plan Estándar no permite generar invitaciones",
    }
  }

  const userCount = await prisma.user.count({ where: { businessId } })
  if (userCount >= limits.maxUsers) {
    return {
      allowed: false,
      message: `Tu plan Pro permite hasta ${limits.maxUsers} usuarios en el negocio`,
    }
  }

  return { allowed: true }
}
