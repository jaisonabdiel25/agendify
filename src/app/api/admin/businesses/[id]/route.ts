import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  const { id } = await params

  try {
    const business = await prisma.business.findUnique({
      where: { id },
      select: { isActive: true },
    })

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 })
    }

    const updated = await prisma.business.update({
      where: { id },
      data: { isActive: !business.isActive },
      select: { id: true, isActive: true },
    })

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
