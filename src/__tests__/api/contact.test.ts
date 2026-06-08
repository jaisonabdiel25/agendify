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
  global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)
  process.env.N8N_CONTACT_WEBHOOK_URL = "https://n8n.test/webhook/agendify-contact"
})

afterEach(() => {
  delete process.env.N8N_CONTACT_WEBHOOK_URL
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

  it("llama al webhook de N8N con el payload correcto", async () => {
    await POST(makeRequest(validBody))
    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.test/webhook/agendify-contact",
      expect.objectContaining({ method: "POST" })
    )
    const fetchBody = JSON.parse(
      (global.fetch as jest.Mock).mock.calls[0][1].body
    )
    expect(fetchBody.email).toBe("usuario@ejemplo.com")
    expect(fetchBody.phone).toBe("61234567")
    expect(fetchBody.message).toBe(validBody.message)
    expect(fetchBody.to).toBeDefined()
  })
})

describe("POST /api/contact — error del webhook", () => {
  it("retorna 500 cuando el webhook responde con error HTTP", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false } as Response)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/enviar/i)
  })

  it("retorna 500 cuando fetch lanza una excepción", async () => {
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })

  it("retorna 500 cuando N8N_CONTACT_WEBHOOK_URL no está configurado", async () => {
    delete process.env.N8N_CONTACT_WEBHOOK_URL
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(500)
  })
})
