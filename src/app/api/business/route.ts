import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const updateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  phone: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  timezone: z.string().min(1, "La zona horaria es requerida"),
  address: z.string().optional(),
})

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No tienes permisos para editar el negocio" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Datos inválidos"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { name, phone, email, timezone, address } = parsed.data

  const business = await prisma.business.update({
    where: { id: session.user.businessId },
    data: {
      name,
      phone: phone || null,
      email: email || null,
      timezone,
      address: address || null,
    },
    select: { id: true, name: true, slug: true, phone: true, email: true, timezone: true, address: true },
  })

  return NextResponse.json(business)
}
