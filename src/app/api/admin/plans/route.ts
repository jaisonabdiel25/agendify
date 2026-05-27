import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { PLAN_PRICE_MIN, PLAN_DISCOUNT_MIN, PLAN_DISCOUNT_MAX } from "@/constant"

const schema = z.object({
  type: z.string().min(2, "El tipo debe tener al menos 2 caracteres"),
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

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  try {
    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        type: true,
        name: true,
        maxServices: true,
        maxChairs: true,
        maxUsers: true,
        canInvite: true,
        statisticsCharts: true,
        price: true,
        discount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    })

    const serialized = plans.map((p) => ({
      ...p,
      price: p.price?.toString() ?? null,
    }))

    return NextResponse.json(serialized)
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
    }

    const { type, name, maxServices, maxChairs, maxUsers, canInvite, statisticsCharts, price, discount } = parsed.data

    const existing = await prisma.plan.findFirst({ where: { type } })
    if (existing) {
      return NextResponse.json({ error: `Ya existe un plan con el tipo "${type}".` }, { status: 409 })
    }

    const plan = await prisma.plan.create({
      data: { type, name, maxServices, maxChairs, maxUsers, canInvite, statisticsCharts, price: price ?? null, discount: discount ?? null },
    })

    return NextResponse.json({ ...plan, price: plan.price?.toString() ?? null }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
