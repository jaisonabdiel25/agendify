import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkActiveUserLimit } from "@/lib/plan-utils"

const bodySchema = z.object({
  isActive: z.boolean(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { businessId, role, id: sessionUserId } = session.user
  if (role !== "OWNER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const parsed = bodySchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { id } = await params
  const { isActive } = parsed.data

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, businessId: true, role: true },
    })

    if (!target || target.businessId !== businessId) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (target.role === "OWNER" && target.id === sessionUserId && !isActive) {
      return NextResponse.json(
        { error: "No puedes desactivar tu propia cuenta de propietario" },
        { status: 400 }
      )
    }

    if (isActive) {
      const limit = await checkActiveUserLimit(businessId)
      if (!limit.allowed) {
        return NextResponse.json({ error: limit.message }, { status: 409 })
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Error al actualizar usuario" }, { status: 500 })
  }
}
