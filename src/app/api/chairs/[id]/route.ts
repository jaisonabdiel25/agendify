import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const chair = await prisma.chair.findFirst({
    where: { id, businessId: session.user.businessId },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      isActive: true,
      userId: true,
      user: { select: { id: true, name: true, email: true } },
    },
  })

  if (!chair) {
    return NextResponse.json({ error: "Puesto no encontrado" }, { status: 404 })
  }

  return NextResponse.json(chair)
}

const patchSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  description: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  isActive: z.boolean().optional(),
  userId: z.string().min(1).nullable().optional(),
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

  const { userId, ...rest } = parsed.data

  if (userId !== undefined && userId !== null) {
    const user = await prisma.user.findFirst({
      where: { id: userId, businessId: session.user.businessId },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 400 })
    }
  }

  const data: Record<string, unknown> = { ...rest }
  if (userId !== undefined) data.userId = userId

  const updated = await prisma.chair.update({
    where: { id },
    data,
    select: { id: true, name: true, description: true, color: true, isActive: true, userId: true },
  })

  return NextResponse.json(updated)
}
