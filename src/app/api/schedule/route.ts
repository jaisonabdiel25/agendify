import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  isActive: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido"),
})

const putSchema = z.object({
  schedules: z.array(daySchema).length(7),
})

async function getUserChair(userId: string, businessId: string) {
  return prisma.chair.findFirst({
    where: { userId, businessId },
    select: { id: true, name: true },
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const chair = await prisma.chair.findFirst({
    where: { userId: session.user.id, businessId: session.user.businessId },
    select: {
      id: true,
      name: true,
      schedules: {
        select: { dayOfWeek: true, isActive: true, openTime: true, closeTime: true },
        orderBy: { dayOfWeek: "asc" },
      },
    },
  })

  if (!chair) {
    return NextResponse.json({ error: "No tienes un puesto asignado" }, { status: 404 })
  }

  return NextResponse.json(chair)
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const chair = await getUserChair(session.user.id, session.user.businessId)
  if (!chair) {
    return NextResponse.json({ error: "No tienes un puesto asignado" }, { status: 404 })
  }

  await prisma.$transaction(
    parsed.data.schedules.map(({ dayOfWeek, isActive, openTime, closeTime }) =>
      prisma.chairSchedule.upsert({
        where: { chairId_dayOfWeek: { chairId: chair.id, dayOfWeek } },
        create: { chairId: chair.id, dayOfWeek, isActive, openTime, closeTime },
        update: { isActive, openTime, closeTime },
      })
    )
  )

  return NextResponse.json({ ok: true })
}
