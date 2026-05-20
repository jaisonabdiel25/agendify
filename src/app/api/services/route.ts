import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const createSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional(),
  durationMinutes: z
    .number({ error: "Ingresa la duración" })
    .int()
    .min(1, "Mínimo 1 minuto"),
  price: z
    .number({ error: "Ingresa el precio" })
    .min(0, "El precio no puede ser negativo"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido"),
  isActive: z.boolean(),
})

async function requireManage() {
  const session = await auth()
  if (!session?.user?.businessId) return null
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") return null
  return session
}

export async function GET() {
  const session = await requireManage()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const services = await prisma.service.findMany({
    where: { businessId: session.user.businessId },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(
    services.map((s) => ({ ...s, price: s.price.toString() }))
  )
}

export async function POST(request: Request) {
  const session = await requireManage()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const service = await prisma.service.create({
    data: { businessId: session.user.businessId, ...parsed.data },
  })

  return NextResponse.json({ ...service, price: service.price.toString() }, { status: 201 })
}
