import { NextResponse } from "next/server"
import { z } from "zod"
import { randomBytes } from "crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  businessId: z.string().min(1),
})

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const bytes = randomBytes(8)
  const result = Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join("")
  return `${result.slice(0, 4)}-${result.slice(4, 8)}`
}

export async function POST(request: Request) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 })
  }

  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
    }

    const { businessId } = parsed.data

    const business = await prisma.business.findUnique({ where: { id: businessId } })
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado." }, { status: 404 })
    }

    let code = generateCode()
    while (await prisma.invitation.findUnique({ where: { code } })) {
      code = generateCode()
    }

    const invitation = await prisma.invitation.create({
      data: { businessId, code },
    })

    return NextResponse.json(invitation, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
