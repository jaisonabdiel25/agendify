jest.mock("@/lib/mailer", () => ({
  isMailConfigured: jest.fn(() => true),
  sendContactEmail: jest.fn().mockResolvedValue(undefined),
}))

import { POST } from "@/app/api/contact/route"
import { isMailConfigured, sendContactEmail } from "@/lib/mailer"

const validBody = {
  email: "usuario@ejemplo.com",
  phone: "61234567",
  message: "Mensaje de prueba con más de 10 caracteres",
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(isMailConfigured as jest.Mock).mockReturnValue(true)
  ;(sendContactEmail as jest.Mock).mockResolvedValue(undefined)
})

describe("POST /api/contact — validación", () => {
  it("retorna 400 con email inválido", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "no-es-email" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con celular que no empieza en 6", async () => {
    const res = await POST(makeRequest({ ...validBody, phone: "71234567" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/iniciar con 6/i)
  })

  it("retorna 400 con celular de menos de 8 dígitos", async () => {
    const res = await POST(makeRequest({ ...validBody, phone: "612345" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con celular de más de 8 dígitos", async () => {
    const res = await POST(makeRequest({ ...validBody, phone: "6123456789" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con mensaje vacío", async () => {
    const res = await POST(makeRequest({ ...validBody, message: "" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con mensaje menor a 10 caracteres", async () => {
    const res = await POST(makeRequest({ ...validBody, message: "Corto" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/10 caracteres/i)
  })

  it("retorna 400 con mensaje mayor a 500 caracteres", async () => {
    const res = await POST(makeRequest({ ...validBody, message: "A".repeat(501) }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/500 caracteres/i)
  })

  it("retorna 400 con body vacío", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/contact — envío exitoso", () => {
  it("retorna 200 con { ok: true } cuando los datos son válidos", async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
  })

  it("envía el correo de contacto con el payload correcto", async () => {
    await POST(makeRequest(validBody))
    expect(sendContactEmail).toHaveBeenCalledTimes(1)
    const arg = (sendContactEmail as jest.Mock).mock.calls[0][0]
    expect(arg.email).toBe("usuario@ejemplo.com")
    expect(arg.phone).toBe("61234567")
    expect(arg.message).toBe(validBody.message)
    expect(arg.to).toBeDefined()
  })
})

describe("POST /api/contact — error del envío", () => {
  it("retorna 500 cuando el envío lanza una excepción", async () => {
    ;(sendContactEmail as jest.Mock).mockRejectedValue(new Error("SMTP error"))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/enviar/i)
  })

  it("retorna 500 cuando SMTP no está configurado", async () => {
    ;(isMailConfigured as jest.Mock).mockReturnValue(false)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})
