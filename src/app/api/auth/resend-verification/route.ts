import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { EMAIL_VERIFY_EXPIRY_HOURS, EMAIL_VERIFY_CODE_DIGITS } from "@/constant"
import { isMailConfigured, sendVerificationEmail } from "@/lib/mailer"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos." }, { status: 400 })
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, isActive: true },
    })

    if (!user || user.isActive) {
      // Respuesta genérica para no revelar si el email existe
      return NextResponse.json({ ok: true })
    }

    const min = Math.pow(10, EMAIL_VERIFY_CODE_DIGITS - 1)
    const max = Math.pow(10, EMAIL_VERIFY_CODE_DIGITS)
    const emailVerifyToken = String(crypto.randomInt(min, max))
    const emailVerifyExpires = new Date(
      Date.now() + EMAIL_VERIFY_EXPIRY_HOURS * 60 * 60 * 1000
    )

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerifyToken, emailVerifyExpires },
    })

    if (isMailConfigured()) {
      sendVerificationEmail({ name: user.name, email, code: emailVerifyToken }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
