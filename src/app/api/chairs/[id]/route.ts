import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  userId: z.string().min(1).nullable(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No tienes permisos" }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const chair = await prisma.chair.findFirst({
    where: { id, businessId: session.user.businessId },
    select: { id: true },
  })
  if (!chair) {
    return NextResponse.json({ error: "Puesto no encontrado" }, { status: 404 })
  }

  if (parsed.data.userId !== null) {
    const user = await prisma.user.findFirst({
      where: { id: parsed.data.userId, businessId: session.user.businessId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 400 })
    }
  }

  const updated = await prisma.chair.update({
    where: { id },
    data: { userId: parsed.data.userId },
    select: { id: true, userId: true },
  })

  return NextResponse.json(updated)
}
