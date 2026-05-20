import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const patchSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  description: z.string().nullable().optional(),
  durationMinutes: z
    .number({ error: "Ingresa la duración" })
    .int()
    .min(1, "Mínimo 1 minuto")
    .optional(),
  price: z
    .number({ error: "Ingresa el precio" })
    .min(0, "El precio no puede ser negativo")
    .optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color inválido").optional(),
  isActive: z.boolean().optional(),
})

async function requireManage() {
  const session = await auth()
  if (!session?.user?.businessId) return null
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") return null
  return session
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireManage()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params

  const existing = await prisma.service.findFirst({
    where: { id, businessId: session.user.businessId },
  })
  if (!existing) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const service = await prisma.service.update({
    where: { id },
    data: parsed.data,
  })

  return NextResponse.json({ ...service, price: service.price.toString() })
}
