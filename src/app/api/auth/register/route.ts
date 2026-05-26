import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const registerSchema = z.object({
  invitationCode: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
    }

    const { invitationCode, name, email, password } = parsed.data

    const invitation = await prisma.invitation.findUnique({
      where: { code: invitationCode },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Código de invitación inválido." },
        { status: 404 }
      )
    }

    if (invitation.usedAt) {
      return NextResponse.json(
        { error: "Este código de invitación ya fue utilizado." },
        { status: 409 }
      )
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: "Este correo ya está registrado." },
        { status: 409 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    await prisma.$transaction(async (tx) => {
      const existingOwner = await tx.user.findFirst({
        where: { businessId: invitation.businessId, role: "OWNER" },
        select: { id: true },
      })

      await tx.user.create({
        data: {
          businessId: invitation.businessId,
          name,
          email,
          passwordHash,
          role: existingOwner ? "STAFF" : "OWNER",
          isActive: true,
        },
      })

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      })
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
