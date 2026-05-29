// eslint-disable-next-line no-var
var mockSend: jest.Mock

jest.mock("resend", () => {
  mockSend = jest.fn()
  return {
    Resend: jest.fn().mockImplementation(() => ({
      emails: { send: mockSend },
    })),
  }
})

import { POST } from "@/app/api/contact/route"

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
  mockSend.mockResolvedValue({ data: { id: "email-1" }, error: null })
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

  it("llama a resend.emails.send con el email del contacto", async () => {
    await POST(makeRequest(validBody))
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("usuario@ejemplo.com"),
      })
    )
  })

  it("incluye el teléfono y el mensaje en el HTML del correo", async () => {
    await POST(makeRequest(validBody))
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("61234567"),
      })
    )
  })
})

describe("POST /api/contact — error de Resend", () => {
  it("retorna 500 cuando Resend devuelve un error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "API error" } })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/enviar/i)
  })

  it("retorna 500 cuando Resend lanza una excepción", async () => {
    mockSend.mockRejectedValue(new Error("Network error"))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})
