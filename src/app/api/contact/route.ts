import { NextResponse } from "next/server"
import { z } from "zod"
import { Resend } from "resend"
import { PHONE_REGEX, PHONE_VALIDATION_MESSAGE } from "@/constant"
import { contactEmailHtml } from "./template"

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

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: "Agendify <onboarding@resend.dev>",
      to: contactEmail,
      subject: `Nuevo mensaje de contacto — ${email}`,
      html: contactEmailHtml({ email, phone, message }),
    })

    if (error) {
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
