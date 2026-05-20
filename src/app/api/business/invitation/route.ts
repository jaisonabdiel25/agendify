import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST() {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No tienes permisos para generar invitaciones" }, { status: 403 })
  }

  const code = randomBytes(6).toString("hex").toUpperCase()

  const invitation = await prisma.invitation.create({
    data: { businessId: session.user.businessId, code },
    select: { id: true, code: true, createdAt: true },
  })

  return NextResponse.json(invitation, { status: 201 })
}
