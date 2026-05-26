import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkActiveUserLimit } from "@/lib/plan-utils"

export async function DELETE(
  _request: Request,
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

  const { id } = await params

  if (id === sessionUserId) {
    return NextResponse.json(
      { error: "No puedes desvincularte a ti mismo" },
      { status: 400 }
    )
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        businessId: true,
        role: true,
        isDeleted: true,
        chair: { select: { id: true } },
      },
    })

    if (!target || target.businessId !== businessId || target.isDeleted) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    if (target.role === "OWNER") {
      return NextResponse.json(
        { error: "No puedes desvincular al propietario del negocio" },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      if (target.chair) {
        await tx.chair.update({
          where: { id: target.chair.id },
          data: { userId: null },
        })
      }
      await tx.user.update({
        where: { id },
        data: { isDeleted: true, isActive: false, businessId: null },
      })
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[DELETE /api/business/users/[id]]", err)
    return NextResponse.json({ error: "Error al desvincular usuario" }, { status: 500 })
  }
}

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
