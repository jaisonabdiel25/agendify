import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const chairs = await prisma.chair.findMany({
    where: { businessId: session.user.businessId, isActive: true },
    select: { id: true, name: true, avatarUrl: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(chairs)
}

const createSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  userId: z.string().optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No tienes permisos para crear puestos" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { name, description, userId } = parsed.data

  if (userId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, businessId: session.user.businessId },
    })
    if (!user) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 400 })
    }
  }

  const chair = await prisma.chair.create({
    data: {
      businessId: session.user.businessId,
      name,
      description: description || null,
      userId: userId || null,
    },
  })

  return NextResponse.json(chair, { status: 201 })
}
