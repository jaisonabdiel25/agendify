jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: jest.fn(),
  },
}))

import { POST } from "@/app/api/public/bookings/route"
import { prisma } from "@/lib/prisma"

const txMock = {
  chair: { findFirst: jest.fn() },
  service: { findFirst: jest.fn() },
  booking: { findFirst: jest.fn(), create: jest.fn() },
  customer: { upsert: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
  business: { findUnique: jest.fn() },
}

const validBody = {
  businessId: "biz-1",
  chairId: "c-1",
  serviceId: "s-1",
  date: "2025-06-15",
  time: "10:00",
  name: "Ana García",
  phone: "61234567",
}

const mockBooking = {
  id: "book-1",
  startTime: new Date("2025-06-15T10:00:00"),
  endTime: new Date("2025-06-15T10:30:00"),
  status: "PENDING",
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
  delete process.env.N8N_BOOKING_WEBHOOK_URL
  ;(prisma.$transaction as jest.Mock).mockImplementation(
    async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock)
  )
  txMock.chair.findFirst.mockResolvedValue({
    id: "c-1",
    name: "Silla Principal",
    user: { name: "Carlos Staff", email: "carlos@ejemplo.com" },
  })
  txMock.service.findFirst.mockResolvedValue({ id: "s-1", name: "Corte", durationMinutes: 30, price: "25.00" })
  txMock.booking.findFirst.mockResolvedValue(null)
  txMock.customer.findFirst.mockResolvedValue(null)
  txMock.customer.create.mockResolvedValue({ id: "cust-1" })
  txMock.customer.upsert.mockResolvedValue({ id: "cust-1" })
  txMock.business.findUnique.mockResolvedValue({ name: "Peluquería Central" })
  txMock.booking.create.mockResolvedValue(mockBooking)
})

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/public/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/public/bookings — body no parseable", () => {
  it("retorna 400 cuando el body no es JSON válido", async () => {
    const req = new Request("http://localhost/api/public/bookings", {
      method: "POST",
      body: "invalid-json-body",
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe("POST /api/public/bookings — validación", () => {
  it("retorna 400 con body vacío", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con fecha inválida", async () => {
    const res = await POST(makeRequest({ ...validBody, date: "no-fecha" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con hora en formato inválido (1 solo dígito)", async () => {
    const res = await POST(makeRequest({ ...validBody, time: "9:00" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con nombre de 1 carácter", async () => {
    const res = await POST(makeRequest({ ...validBody, name: "A" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con email inválido", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "no-email" }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 con teléfono inválido (no inicia con 6)", async () => {
    const res = await POST(makeRequest({ ...validBody, phone: "71234567" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/teléfono/i)
  })

  it("retorna 400 con teléfono inválido (menos de 8 dígitos)", async () => {
    const res = await POST(makeRequest({ ...validBody, phone: "612345" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/teléfono/i)
  })

  it("retorna 400 sin teléfono", async () => {
    const { phone: _phone, ...bodyWithoutPhone } = validBody
    const res = await POST(makeRequest(bodyWithoutPhone))
    expect(res.status).toBe(400)
  })

  it("retorna 400 sin businessId", async () => {
    const { businessId: _omit, ...withoutBiz } = validBody
    const res = await POST(makeRequest(withoutBiz))
    expect(res.status).toBe(400)
  })
})

describe("POST /api/public/bookings — errores de transacción", () => {
  it("lanza error cuando el puesto no existe en el negocio", async () => {
    txMock.chair.findFirst.mockResolvedValue(null)
    await expect(POST(makeRequest(validBody))).rejects.toThrow("Puesto no válido")
  })

  it("lanza error cuando el servicio no existe en el negocio", async () => {
    txMock.service.findFirst.mockResolvedValue(null)
    await expect(POST(makeRequest(validBody))).rejects.toThrow("Servicio no válido")
  })

  it("lanza error cuando hay conflicto de horario", async () => {
    txMock.booking.findFirst.mockResolvedValue({ id: "booking-existente" })
    await expect(POST(makeRequest(validBody))).rejects.toThrow(/ya no está disponible/i)
  })
})

describe("POST /api/public/bookings — reserva exitosa", () => {
  it("retorna 201 con la reserva creada", async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe("book-1")
    expect(body.status).toBe("PENDING")
  })

  it("usa customer.create cuando no se proporciona email", async () => {
    await POST(makeRequest(validBody))
    expect(txMock.customer.create).toHaveBeenCalled()
    expect(txMock.customer.upsert).not.toHaveBeenCalled()
  })

  it("usa customer.upsert cuando se proporciona email", async () => {
    await POST(makeRequest({ ...validBody, email: "ana@ejemplo.com" }))
    expect(txMock.customer.upsert).toHaveBeenCalled()
    expect(txMock.customer.create).not.toHaveBeenCalled()
  })

  it("la reserva se crea con estado PENDING", async () => {
    await POST(makeRequest(validBody))
    expect(txMock.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "PENDING" }),
      })
    )
  })

  it("acepta email vacío como string (cliente sin email)", async () => {
    const res = await POST(makeRequest({ ...validBody, email: "" }))
    expect(res.status).toBe(201)
    expect(txMock.customer.create).toHaveBeenCalled()
  })

  it("las notas se guardan correctamente cuando se proporcionan", async () => {
    await POST(makeRequest({ ...validBody, notes: "Alergia al tinte" }))
    expect(txMock.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ notes: "Alergia al tinte" }),
      })
    )
  })
})

describe("POST /api/public/bookings — webhook n8n", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)
  })

  it("llama al webhook cuando N8N_BOOKING_WEBHOOK_URL está configurado y el staff tiene email", async () => {
    process.env.N8N_BOOKING_WEBHOOK_URL = "https://n8n.test/webhook/agendify-booking"
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).toHaveBeenCalledWith(
      "https://n8n.test/webhook/agendify-booking",
      expect.objectContaining({ method: "POST" })
    )
    delete process.env.N8N_BOOKING_WEBHOOK_URL
  })

  it("el payload del webhook contiene type: 'new_booking'", async () => {
    process.env.N8N_BOOKING_WEBHOOK_URL = "https://n8n.test/webhook/agendify-booking"
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    const fetchBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string)
    expect(fetchBody.type).toBe("new_booking")
    delete process.env.N8N_BOOKING_WEBHOOK_URL
  })

  it("el payload incluye datos del staff, cliente, servicio, puesto y negocio", async () => {
    process.env.N8N_BOOKING_WEBHOOK_URL = "https://n8n.test/webhook/agendify-booking"
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    const fetchBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body as string)
    expect(fetchBody).toHaveProperty("staff.email", "carlos@ejemplo.com")
    expect(fetchBody).toHaveProperty("customer.name", "Ana García")
    expect(fetchBody).toHaveProperty("service.name", "Corte")
    expect(fetchBody).toHaveProperty("chair.name", "Silla Principal")
    expect(fetchBody).toHaveProperty("business.name", "Peluquería Central")
    delete process.env.N8N_BOOKING_WEBHOOK_URL
  })

  it("no llama al webhook si N8N_BOOKING_WEBHOOK_URL no está configurado", async () => {
    delete process.env.N8N_BOOKING_WEBHOOK_URL
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("no llama al webhook si el chair no tiene usuario asignado", async () => {
    process.env.N8N_BOOKING_WEBHOOK_URL = "https://n8n.test/webhook/agendify-booking"
    txMock.chair.findFirst.mockResolvedValue({ id: "c-1", name: "Silla Sin Staff", user: null })
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
    delete process.env.N8N_BOOKING_WEBHOOK_URL
  })

  it("no llama al webhook si el usuario del chair no tiene email", async () => {
    process.env.N8N_BOOKING_WEBHOOK_URL = "https://n8n.test/webhook/agendify-booking"
    txMock.chair.findFirst.mockResolvedValue({
      id: "c-1",
      name: "Silla A",
      user: { name: "Staff Sin Email", email: null },
    })
    await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    expect(global.fetch).not.toHaveBeenCalled()
    delete process.env.N8N_BOOKING_WEBHOOK_URL
  })

  it("no lanza error si el webhook falla (fire and forget)", async () => {
    process.env.N8N_BOOKING_WEBHOOK_URL = "https://n8n.test/webhook/agendify-booking"
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"))
    const res = await POST(makeRequest(validBody))
    await new Promise((r) => setTimeout(r, 0))
    expect(res.status).toBe(201)
    delete process.env.N8N_BOOKING_WEBHOOK_URL
  })
})
