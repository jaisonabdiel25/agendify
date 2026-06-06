import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { EMAIL_VERIFY_EXPIRY_HOURS, EMAIL_VERIFY_CODE_DIGITS, WEBHOOK_EVENT_REGISTER } from "@/constant"

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
    const min = Math.pow(10, EMAIL_VERIFY_CODE_DIGITS - 1)
    const max = Math.pow(10, EMAIL_VERIFY_CODE_DIGITS)
    const emailVerifyToken = String(crypto.randomInt(min, max))
    const emailVerifyExpires = new Date(
      Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000
    )

    await prisma.$transaction(async (tx) => {
      const existingOwner = await tx.user.findFirst({
        where: {
          OR: [
            { businessId: invitation.businessId },
            { pendingBusinessId: invitation.businessId },
          ],
        },
        select: { id: true },
      })

      await tx.user.create({
        data: {
          businessId: null,
          pendingBusinessId: invitation.businessId,
          name,
          email,
          passwordHash,
          role: existingOwner ? "STAFF" : "OWNER",
          isActive: false,
          emailVerifyToken,
          emailVerifyExpires,
        },
      })

      await tx.invitation.update({
        where: { id: invitation.id },
        data: { usedAt: new Date() },
      })
    })

    const webhookUrl = process.env.N8N_WEBHOOK_URL

    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, code: emailVerifyToken, type: WEBHOOK_EVENT_REGISTER }),
      }).catch(() => {})
    }

    return NextResponse.json(
      { ok: true, message: "Revisa tu correo para activar tu cuenta." },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
