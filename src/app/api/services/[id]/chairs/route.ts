import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

type Params = { params: Promise<{ id: string }> }

async function requireManage() {
  const session = await auth()
  if (!session?.user?.businessId) return null
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") return null
  return session
}

export async function GET(_req: Request, { params }: Params) {
  const session = await requireManage()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const service = await prisma.service.findFirst({
    where: { id, businessId: session.user.businessId },
    select: { id: true },
  })
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
  }

  const links = await prisma.chairService.findMany({
    where: { serviceId: id },
    select: { chairId: true },
  })

  return NextResponse.json(links.map((l) => l.chairId))
}

const putSchema = z.object({
  chairIds: z.array(z.string()),
})

export async function PUT(request: Request, { params }: Params) {
  const session = await requireManage()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const service = await prisma.service.findFirst({
    where: { id, businessId: session.user.businessId },
    select: { id: true },
  })
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { chairIds } = parsed.data

  if (chairIds.length > 0) {
    const validChairs = await prisma.chair.findMany({
      where: { id: { in: chairIds }, businessId: session.user.businessId },
      select: { id: true },
    })
    if (validChairs.length !== chairIds.length) {
      return NextResponse.json({ error: "Uno o más puestos no son válidos" }, { status: 400 })
    }
  }

  await prisma.$transaction([
    prisma.chairService.deleteMany({ where: { serviceId: id } }),
    ...(chairIds.length > 0
      ? [
          prisma.chairService.createMany({
            data: chairIds.map((chairId) => ({ chairId, serviceId: id })),
          }),
        ]
      : []),
  ])

  return NextResponse.json({ ok: true })
}
