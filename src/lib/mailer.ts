import nodemailer, { type Transporter } from "nodemailer"
import type { Prisma } from "@prisma/client"

// ─── Transporter singleton ──────────────────────────────────────────────────
// Se reutiliza la instancia en `global` para evitar recrear el pool de
// conexiones SMTP en cada hot-reload de desarrollo (mismo patrón que prisma.ts).

const globalForMailer = global as unknown as { mailer: Transporter | undefined }

function getTransporter(): Transporter {
  if (globalForMailer.mailer) return globalForMailer.mailer

  const port = Number(process.env.SMTP_PORT ?? 587)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  if (process.env.NODE_ENV !== "production") globalForMailer.mailer = transporter
  return transporter
}

/**
 * Indica si el envío de correos está configurado. Permite preservar la semántica
 * condicional previa (los webhooks sólo se llamaban si la URL existía).
 */
export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST)
}

interface SendMailOptions {
  to: string
  subject: string
  html: string
}

async function sendMail({ to, subject, html }: SendMailOptions): Promise<void> {
  const from = process.env.SMTP_FROM ?? "Agendify <no-reply@agendify.app>"
  await getTransporter().sendMail({ from, to, subject, html })
}

// ─── Plantilla base ───────────────────────────────────────────────────────────

const BRAND_DARK = "#1a1a1a"
const BRAND_BG = "#fcfbf7"
const BRAND_MUTED = "#6b6b6b"
const BRAND_BORDER = "#e8e6df"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Envuelve el contenido en un layout HTML con el branding de Agendify. */
function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:${BRAND_BG};font-family:Georgia,'Times New Roman',serif;color:${BRAND_DARK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND_BG};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border:1px solid ${BRAND_BORDER};border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background-color:${BRAND_DARK};padding:24px 32px;">
              <span style="font-size:22px;font-style:italic;color:#ffffff;letter-spacing:0.5px;">Agendify</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:${BRAND_DARK};">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BRAND_BORDER};font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND_MUTED};">
              Este es un correo automático de Agendify. Por favor no respondas a este mensaje.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Bloque destacado para mostrar un código de verificación. */
function codeBlock(code: string): string {
  return `<div style="margin:24px 0;padding:18px;background-color:${BRAND_BG};border:1px dashed ${BRAND_BORDER};border-radius:8px;text-align:center;">
    <span style="font-size:30px;font-weight:bold;letter-spacing:8px;color:${BRAND_DARK};">${escapeHtml(code)}</span>
  </div>`
}

// ─── Correos de autenticación ──────────────────────────────────────────────────

interface VerificationEmailParams {
  name: string
  email: string
  code: string
}

/** Verificación de cuenta (registro y reenvío usan el mismo correo). */
export async function sendVerificationEmail({
  name,
  email,
  code,
}: VerificationEmailParams): Promise<void> {
  const html = baseLayout(`
    <p style="margin:0 0 12px;">Hola ${escapeHtml(name)},</p>
    <p style="margin:0 0 8px;">Gracias por registrarte en Agendify. Usa el siguiente código para activar tu cuenta:</p>
    ${codeBlock(code)}
    <p style="margin:0;color:${BRAND_MUTED};font-size:13px;">El código expira en 24 horas. Si no creaste esta cuenta, puedes ignorar este correo.</p>
  `)

  await sendMail({
    to: email,
    subject: "Activa tu cuenta en Agendify",
    html,
  })
}

interface PasswordResetEmailParams {
  name: string
  email: string
  code: string
}

/** Restablecimiento de contraseña. */
export async function sendPasswordResetEmail({
  name,
  email,
  code,
}: PasswordResetEmailParams): Promise<void> {
  const html = baseLayout(`
    <p style="margin:0 0 12px;">Hola ${escapeHtml(name)},</p>
    <p style="margin:0 0 8px;">Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código para continuar:</p>
    ${codeBlock(code)}
    <p style="margin:0;color:${BRAND_MUTED};font-size:13px;">El código expira en 1 hora. Si no solicitaste este cambio, ignora este correo y tu contraseña seguirá igual.</p>
  `)

  await sendMail({
    to: email,
    subject: "Restablece tu contraseña en Agendify",
    html,
  })
}

// ─── Notificación de nueva reserva ──────────────────────────────────────────────

interface BookingNotificationParams {
  booking: {
    id: string
    startTime: Date
    endTime: Date
    notes: string | null
  }
  staff: {
    name: string
    email: string
  }
  customer: {
    name: string
    email: string | null
    phone: string
  }
  service: {
    name: string
    durationMinutes: number
    price: Prisma.Decimal | number | string | null
  }
  chair: {
    name: string
  }
  business: {
    name: string
  }
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date)
}

function row(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:${BRAND_MUTED};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:6px 0 6px 16px;color:${BRAND_DARK};">${escapeHtml(value)}</td>
  </tr>`
}

/** Notifica al staff de una nueva reserva creada desde la reserva pública. */
export async function sendBookingNotificationEmail({
  booking,
  staff,
  customer,
  service,
  chair,
  business,
}: BookingNotificationParams): Promise<void> {
  const priceText =
    service.price == null ? "—" : `$${Number(service.price).toFixed(2)}`

  const detailRows = [
    row("Cliente", customer.name),
    row("Teléfono", customer.phone),
    customer.email ? row("Correo", customer.email) : "",
    row("Servicio", `${service.name} (${service.durationMinutes} min)`),
    row("Precio", priceText),
    row("Puesto", chair.name),
    row("Fecha", formatDateTime(booking.startTime)),
    booking.notes ? row("Notas", booking.notes) : "",
  ].join("")

  const html = baseLayout(`
    <p style="margin:0 0 12px;">Hola ${escapeHtml(staff.name)},</p>
    <p style="margin:0 0 16px;">Tienes una nueva reserva en <strong>${escapeHtml(business.name)}</strong>:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;border-top:1px solid ${BRAND_BORDER};border-bottom:1px solid ${BRAND_BORDER};">
      ${detailRows}
    </table>
  `)

  await sendMail({
    to: staff.email,
    subject: `Nueva reserva — ${service.name}`,
    html,
  })
}

// ─── Formulario de contacto ─────────────────────────────────────────────────────

interface ContactEmailParams {
  email: string
  phone: string
  message: string
  to: string
}

/** Reenvía un mensaje del formulario de contacto al buzón de Agendify. */
export async function sendContactEmail({
  email,
  phone,
  message,
  to,
}: ContactEmailParams): Promise<void> {
  const html = baseLayout(`
    <p style="margin:0 0 16px;">Nuevo mensaje desde el formulario de contacto:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;font-size:14px;border-top:1px solid ${BRAND_BORDER};border-bottom:1px solid ${BRAND_BORDER};">
      ${row("Correo", email)}
      ${row("Teléfono", phone)}
    </table>
    <p style="margin:16px 0 4px;color:${BRAND_MUTED};">Mensaje:</p>
    <p style="margin:0;white-space:pre-wrap;">${escapeHtml(message)}</p>
  `)

  await sendMail({
    to,
    subject: "Nuevo mensaje de contacto — Agendify",
    html,
  })
}
