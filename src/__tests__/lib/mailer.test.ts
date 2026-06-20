jest.mock("nodemailer", () => {
  const sendMail = jest.fn().mockResolvedValue({ messageId: "test-id" })
  const createTransport = jest.fn(() => ({ sendMail }))
  return { __esModule: true, default: { createTransport }, createTransport }
})

import nodemailer from "nodemailer"
import {
  isMailConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendBookingNotificationEmail,
  sendContactEmail,
} from "@/lib/mailer"

const mockSendMail = (nodemailer.createTransport as jest.Mock)().sendMail as jest.Mock
const ORIGINAL_ENV = process.env

beforeEach(() => {
  mockSendMail.mockClear()
  mockSendMail.mockResolvedValue({ messageId: "test-id" })
  process.env = {
    ...ORIGINAL_ENV,
    SMTP_HOST: "smtp.test.com",
    SMTP_PORT: "587",
    SMTP_USER: "user",
    SMTP_PASS: "pass",
    SMTP_FROM: "Agendify <no-reply@agendify.app>",
  }
})

afterEach(() => {
  process.env = ORIGINAL_ENV
})

describe("isMailConfigured", () => {
  it("retorna true cuando SMTP_HOST está definido", () => {
    process.env.SMTP_HOST = "smtp.test.com"
    expect(isMailConfigured()).toBe(true)
  })

  it("retorna false cuando SMTP_HOST no está definido", () => {
    delete process.env.SMTP_HOST
    expect(isMailConfigured()).toBe(false)
  })
})

describe("sendVerificationEmail", () => {
  it("envía al correo del usuario con asunto de activación", async () => {
    await sendVerificationEmail({ name: "Juan", email: "juan@test.com", code: "123456" })
    expect(mockSendMail).toHaveBeenCalledTimes(1)
    const arg = mockSendMail.mock.calls[0][0]
    expect(arg.to).toBe("juan@test.com")
    expect(arg.subject).toMatch(/activa/i)
    expect(arg.from).toBe("Agendify <no-reply@agendify.app>")
  })

  it("incluye el código y el nombre en el HTML", async () => {
    await sendVerificationEmail({ name: "Juan", email: "juan@test.com", code: "123456" })
    const arg = mockSendMail.mock.calls[0][0]
    expect(arg.html).toContain("123456")
    expect(arg.html).toContain("Juan")
  })

  it("propaga el error si el envío falla", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP error"))
    await expect(
      sendVerificationEmail({ name: "Juan", email: "juan@test.com", code: "123456" })
    ).rejects.toThrow("SMTP error")
  })
})

describe("sendPasswordResetEmail", () => {
  it("envía al correo del usuario con asunto de restablecimiento y el código", async () => {
    await sendPasswordResetEmail({ name: "Ana", email: "ana@test.com", code: "654321" })
    const arg = mockSendMail.mock.calls[0][0]
    expect(arg.to).toBe("ana@test.com")
    expect(arg.subject).toMatch(/restablece/i)
    expect(arg.html).toContain("654321")
  })
})

describe("sendBookingNotificationEmail", () => {
  const params = {
    booking: {
      id: "book-1",
      startTime: new Date("2025-06-15T10:00:00"),
      endTime: new Date("2025-06-15T10:30:00"),
      notes: "Alergia al tinte",
    },
    staff: { name: "Carlos", email: "carlos@test.com" },
    customer: { name: "Ana García", email: "ana@test.com", phone: "61234567" },
    service: { name: "Corte", durationMinutes: 30, price: "25.00" },
    chair: { name: "Silla Principal" },
    business: { name: "Peluquería Central" },
  }

  it("envía al correo del staff con los datos de la reserva", async () => {
    await sendBookingNotificationEmail(params)
    const arg = mockSendMail.mock.calls[0][0]
    expect(arg.to).toBe("carlos@test.com")
    expect(arg.subject).toMatch(/nueva reserva/i)
    expect(arg.html).toContain("Ana García")
    expect(arg.html).toContain("Corte")
    expect(arg.html).toContain("Silla Principal")
    expect(arg.html).toContain("Peluquería Central")
    expect(arg.html).toContain("$25.00")
    expect(arg.html).toContain("Alergia al tinte")
  })

  it("muestra guion cuando el precio es nulo", async () => {
    await sendBookingNotificationEmail({
      ...params,
      service: { ...params.service, price: null },
    })
    const arg = mockSendMail.mock.calls[0][0]
    expect(arg.html).toContain("—")
  })

  it("omite el correo del cliente cuando no se proporciona", async () => {
    await sendBookingNotificationEmail({
      ...params,
      customer: { ...params.customer, email: null },
    })
    expect(mockSendMail).toHaveBeenCalledTimes(1)
  })
})

describe("sendContactEmail", () => {
  it("envía al buzón de destino con el mensaje", async () => {
    await sendContactEmail({
      email: "cliente@test.com",
      phone: "61234567",
      message: "Hola, necesito ayuda",
      to: "hola@agendify.app",
    })
    const arg = mockSendMail.mock.calls[0][0]
    expect(arg.to).toBe("hola@agendify.app")
    expect(arg.subject).toMatch(/contacto/i)
    expect(arg.html).toContain("cliente@test.com")
    expect(arg.html).toContain("Hola, necesito ayuda")
  })

  it("escapa caracteres HTML del mensaje", async () => {
    await sendContactEmail({
      email: "cliente@test.com",
      phone: "61234567",
      message: "<script>alert(1)</script>",
      to: "hola@agendify.app",
    })
    const arg = mockSendMail.mock.calls[0][0]
    expect(arg.html).not.toContain("<script>")
    expect(arg.html).toContain("&lt;script&gt;")
  })
})
