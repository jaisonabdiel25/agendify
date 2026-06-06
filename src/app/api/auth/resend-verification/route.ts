import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { EMAIL_VERIFY_EXPIRY_HOURS, EMAIL_VERIFY_CODE_DIGITS, WEBHOOK_EVENT_RESEND } from "@/constant"

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

    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user.name, email, code: emailVerifyToken, type: WEBHOOK_EVENT_RESEND }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
