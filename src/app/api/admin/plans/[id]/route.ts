import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PLAN_PRICE_MIN, PLAN_DISCOUNT_MIN, PLAN_DISCOUNT_MAX } from "@/constant"

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  maxServices: z.number().int().min(1, "Mínimo 1 servicio"),
  maxChairs: z.number().int().min(1, "Mínimo 1 puesto"),
  maxUsers: z.number().int().min(1, "Mínimo 1 usuario"),
  canInvite: z.boolean(),
  statisticsCharts: z.array(z.string()).min(1, "Debe incluir al menos un gráfico"),
  price: z.number().min(PLAN_PRICE_MIN, "El precio no puede ser negativo").nullable().optional(),
  discount: z
    .number()
    .min(PLAN_DISCOUNT_MIN, "El descuento no puede ser negativo")
    .max(PLAN_DISCOUNT_MAX, "El descuento no puede superar el 100%")
    .nullable()
    .optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  try {
    const { id } = await params
    const plan = await prisma.plan.findUnique({ where: { id } })
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 })
    }

    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
    }

    const { name, maxServices, maxChairs, maxUsers, canInvite, statisticsCharts, price, discount } = parsed.data

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        name,
        maxServices,
        maxChairs,
        maxUsers,
        canInvite,
        statisticsCharts,
        price: price !== undefined ? price : null,
        discount: discount !== undefined ? discount : null,
      },
    })

    return NextResponse.json({ ...updated, price: updated.price?.toString() ?? null })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
