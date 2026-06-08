import { NextResponse } from "next/server"
import { z } from "zod"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import {
  PASSWORD_RESET_CODE_DIGITS,
  PASSWORD_RESET_EXPIRY_HOURS,
  WEBHOOK_EVENT_PASSWORD_RESET,
} from "@/constant"

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

    if (!user || !user.isActive) {
      return NextResponse.json({ ok: true })
    }

    const min = Math.pow(10, PASSWORD_RESET_CODE_DIGITS - 1)
    const max = Math.pow(10, PASSWORD_RESET_CODE_DIGITS)
    const passwordResetToken = String(crypto.randomInt(min, max))
    const passwordResetExpires = new Date(
      Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000
    )

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken, passwordResetExpires },
    })

    const webhookUrl = process.env.N8N_PASSWORD_RESET_WEBHOOK_URL
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email,
          code: passwordResetToken,
          type: WEBHOOK_EVENT_PASSWORD_RESET,
        }),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 })
  }
}
