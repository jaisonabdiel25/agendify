import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  planId: z.string().min(1),
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
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
    }

    const { planId } = parsed.data

    const [business, plan] = await Promise.all([
      prisma.business.findUnique({ where: { id } }),
      prisma.plan.findUnique({ where: { id: planId } }),
    ])

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 })
    }
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado." }, { status: 400 })
    }

    const updated = await prisma.business.update({
      where: { id },
      data: { planId },
      select: { id: true, planId: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
