import { NextResponse } from "next/server"
import { z } from "zod"
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "@/constant"

const contactSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo válido." }),
  phone: z.string().regex(PHONE_REGEX, PHONE_VALIDATION_MESSAGE),
  message: z
    .string()
    .min(10, "El mensaje debe tener al menos 10 caracteres.")
    .max(500, "El mensaje no puede superar los 500 caracteres."),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, phone, message } = parsed.data
    const contactEmail = process.env.CONTACT_EMAIL ?? "hola@agendify.app"
    const webhookUrl = process.env.N8N_CONTACT_WEBHOOK_URL

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "No se pudo enviar el mensaje. Intenta de nuevo." },
        { status: 500 }
      )
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, phone, message, to: contactEmail }),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: "No se pudo enviar el mensaje. Intenta de nuevo." },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 }
    )
  }
}
