import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkInviteAllowed } from "@/lib/plan-utils"

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

function generateCode(): string {
  const bytes = randomBytes(8)
  const result = Array.from(bytes).map((b) => CHARS[b % CHARS.length]).join("")
  return `${result.slice(0, 4)}-${result.slice(4, 8)}`
}

export async function POST() {
  const session = await auth()
  if (!session?.user?.businessId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No tienes permisos para generar invitaciones" }, { status: 403 })
  }

  const limitCheck = await checkInviteAllowed(session.user.businessId)
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.message }, { status: 403 })
  }

  let code = generateCode()
  while (await prisma.invitation.findUnique({ where: { code } })) {
    code = generateCode()
  }

  const invitation = await prisma.invitation.create({
    data: { businessId: session.user.businessId, code, createdById: session.user.id },
    select: { id: true, code: true, createdAt: true },
  })

  return NextResponse.json(invitation, { status: 201 })
}
