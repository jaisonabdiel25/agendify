/**
 * @jest-environment jsdom
 */

jest.setTimeout(20000)

import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BookingWizard } from "@/components/modules/reserve/booking-wizard"

const businesses = [
  { id: "biz-1", name: "Barbería Central", slug: "barberia-central", address: "Calle 50, Panamá" },
  { id: "biz-2", name: "Salon Luna", slug: "salon-luna", address: null },
]

const chairs = [
  { id: "chair-1", name: "Silla A", description: "Especialista en cortes clásicos" },
  { id: "chair-2", name: "Silla B", description: null },
]

const services = [
  { id: "srv-1", name: "Corte clásico", durationMinutes: 30, price: "25.00", color: "#6366f1" },
  { id: "srv-2", name: "Barba", durationMinutes: 20, price: "15.00", color: "#f59e0b" },
]

const slots = ["09:00", "09:30", "10:00"]

function mockFetch(responses: unknown[]) {
  let callIndex = 0
  global.fetch = jest.fn().mockImplementation(() => {
    const response = responses[callIndex] ?? responses[responses.length - 1]
    callIndex++
    return Promise.resolve({
      ok: true,
      json: async () => response,
    } as Response)
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch([businesses])
})

// ─── Paso 1: Seleccionar negocio ──────────────────────────────────────────────

describe("BookingWizard — Paso 1: Negocios", () => {
  it("muestra el título Reservar cita", async () => {
    render(<BookingWizard />)
    expect(screen.getByText("Reservar cita")).toBeInTheDocument()
  })

  it("muestra los negocios disponibles después de cargar", async () => {
    render(<BookingWizard />)
    await waitFor(() => {
      expect(screen.getByText("Barbería Central")).toBeInTheDocument()
      expect(screen.getByText("Salon Luna")).toBeInTheDocument()
    })
  })

  it("muestra la dirección del negocio cuando está disponible", async () => {
    render(<BookingWizard />)
    await waitFor(() => {
      expect(screen.getByText("Calle 50, Panamá")).toBeInTheDocument()
    })
  })

  it("muestra estado vacío cuando no hay negocios", async () => {
    mockFetch([[]])
    render(<BookingWizard />)
    await waitFor(() => {
      expect(screen.getByText("No hay negocios disponibles.")).toBeInTheDocument()
    })
  })

  it("muestra el indicador 1 / 5 del paso", async () => {
    render(<BookingWizard />)
    await waitFor(() => {
      expect(screen.getByText(/1 \/ 5/)).toBeInTheDocument()
    })
  })
})

// ─── Paso 2: Seleccionar puesto ────────────────────────────────────────────────

describe("BookingWizard — Paso 2: Puestos", () => {
  async function goToStep2() {
    mockFetch([businesses, chairs])
    render(<BookingWizard />)
    await waitFor(() => screen.getByText("Barbería Central"))
    const user = userEvent.setup()
    await user.click(screen.getByText("Barbería Central"))
    return user
  }

  it("avanza al paso 2 al seleccionar un negocio", async () => {
    await goToStep2()
    await waitFor(() => {
      expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument()
    })
  })

  it("muestra los puestos disponibles en el paso 2", async () => {
    await goToStep2()
    await waitFor(() => {
      expect(screen.getByText("Silla A")).toBeInTheDocument()
      expect(screen.getByText("Silla B")).toBeInTheDocument()
    })
  })

  it("muestra la descripción del puesto cuando existe", async () => {
    await goToStep2()
    await waitFor(() => {
      expect(screen.getByText("Especialista en cortes clásicos")).toBeInTheDocument()
    })
  })

  it("muestra estado vacío cuando no hay puestos", async () => {
    mockFetch([businesses, []])
    render(<BookingWizard />)
    await waitFor(() => screen.getByText("Barbería Central"))
    const user = userEvent.setup()
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => {
      expect(screen.getByText("No hay puestos disponibles en este negocio.")).toBeInTheDocument()
    })
  })

  it("vuelve al paso 1 al hacer clic en Atrás", async () => {
    await goToStep2()
    await waitFor(() => screen.getByText("Silla A"))
    const user = userEvent.setup()
    await user.click(screen.getByText("Atrás"))
    await waitFor(() => {
      expect(screen.getByText(/1 \/ 5/)).toBeInTheDocument()
    })
  })
})

// ─── Paso 3: Seleccionar servicio ─────────────────────────────────────────────

describe("BookingWizard — Paso 3: Servicios", () => {
  async function goToStep3() {
    mockFetch([businesses, chairs, services])
    render(<BookingWizard />)
    const user = userEvent.setup()
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByText("Silla A"))
    return user
  }

  it("avanza al paso 3 al seleccionar un puesto", async () => {
    await goToStep3()
    await waitFor(() => {
      expect(screen.getByText(/3 \/ 5/)).toBeInTheDocument()
    })
  })

  it("muestra los servicios disponibles", async () => {
    await goToStep3()
    await waitFor(() => {
      expect(screen.getByText("Corte clásico")).toBeInTheDocument()
      expect(screen.getByText("Barba")).toBeInTheDocument()
    })
  })

  it("muestra duración y precio del servicio", async () => {
    await goToStep3()
    await waitFor(() => {
      expect(screen.getByText("30 min · $25.00")).toBeInTheDocument()
    })
  })

  it("muestra estado vacío cuando no hay servicios", async () => {
    mockFetch([businesses, chairs, []])
    render(<BookingWizard />)
    const user = userEvent.setup()
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByText("Silla A"))
    await waitFor(() => {
      expect(screen.getByText("Este puesto no tiene servicios disponibles.")).toBeInTheDocument()
    })
  })

  it("vuelve al paso 2 al hacer clic en Atrás desde el paso 3", async () => {
    const user = await goToStep3()
    await waitFor(() => screen.getByText(/3 \/ 5/))
    await user.click(screen.getByText("Atrás"))
    await waitFor(() => {
      expect(screen.getByText(/2 \/ 5/)).toBeInTheDocument()
    })
  })
})

// ─── Paso 4: Seleccionar fecha y hora ─────────────────────────────────────────

describe("BookingWizard — Paso 4: Fecha y hora", () => {
  async function goToStep4() {
    mockFetch([businesses, chairs, services, slots])
    render(<BookingWizard />)
    const user = userEvent.setup()
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByText("Silla A"))
    await waitFor(() => screen.getByText("Corte clásico"))
    await user.click(screen.getByText("Corte clásico"))
    return user
  }

  it("avanza al paso 4 al seleccionar un servicio", async () => {
    await goToStep4()
    await waitFor(() => {
      expect(screen.getByText(/4 \/ 5/)).toBeInTheDocument()
    })
  })

  it("muestra el campo de fecha en el paso 4", async () => {
    await goToStep4()
    await waitFor(() => {
      expect(screen.getByLabelText("Selecciona una fecha")).toBeInTheDocument()
    })
  })

  it("muestra los slots al ingresar una fecha", async () => {
    await goToStep4()
    await waitFor(() => screen.getByLabelText("Selecciona una fecha"))
    fireEvent.change(screen.getByLabelText("Selecciona una fecha"), {
      target: { value: "2025-06-01" },
    })
    await waitFor(() => {
      expect(screen.getByText("9:00 AM")).toBeInTheDocument()
    })
  })

  it("muestra estado vacío cuando no hay horarios disponibles", async () => {
    mockFetch([businesses, chairs, services, []])
    render(<BookingWizard />)
    const user = userEvent.setup()
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByText("Silla A"))
    await waitFor(() => screen.getByText("Corte clásico"))
    await user.click(screen.getByText("Corte clásico"))
    await waitFor(() => screen.getByLabelText("Selecciona una fecha"))
    fireEvent.change(screen.getByLabelText("Selecciona una fecha"), {
      target: { value: "2025-06-01" },
    })
    await waitFor(() => {
      expect(screen.getByText("No hay horarios disponibles para este día.")).toBeInTheDocument()
    })
  })

  it("avanza al paso 5 al seleccionar hora y hacer clic en Continuar", async () => {
    const user = await goToStep4()
    await waitFor(() => screen.getByLabelText("Selecciona una fecha"))
    fireEvent.change(screen.getByLabelText("Selecciona una fecha"), {
      target: { value: "2025-06-01" },
    })
    await waitFor(() => screen.getByText("9:00 AM"))
    await user.click(screen.getByText("9:00 AM"))
    await user.click(screen.getByRole("button", { name: "Continuar" }))
    await waitFor(() => {
      expect(screen.getByText(/5 \/ 5/)).toBeInTheDocument()
    })
  })

  it("vuelve al paso 3 al hacer clic en Atrás desde el paso 4", async () => {
    const user = await goToStep4()
    await waitFor(() => screen.getByText(/4 \/ 5/))
    await user.click(screen.getByText("Atrás"))
    await waitFor(() => {
      expect(screen.getByText(/3 \/ 5/)).toBeInTheDocument()
    })
  })

  it("muestra horarios PM con formato 12 horas (12:00 PM)", async () => {
    mockFetch([businesses, chairs, services, ["12:00", "14:00"]])
    render(<BookingWizard />)
    const user = userEvent.setup()
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByText("Silla A"))
    await waitFor(() => screen.getByText("Corte clásico"))
    await user.click(screen.getByText("Corte clásico"))
    await waitFor(() => screen.getByLabelText("Selecciona una fecha"))
    fireEvent.change(screen.getByLabelText("Selecciona una fecha"), {
      target: { value: "2025-06-01" },
    })
    await waitFor(() => {
      expect(screen.getByText("12:00 PM")).toBeInTheDocument()
      expect(screen.getByText("2:00 PM")).toBeInTheDocument()
    })
  })
})

// ─── Paso 5: Datos personales ─────────────────────────────────────────────────

describe("BookingWizard — Paso 5: Datos personales", () => {
  async function goToStep5() {
    render(<BookingWizard />)
    const user = userEvent.setup()
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByText("Silla A"))
    await waitFor(() => screen.getByText("Corte clásico"))
    await user.click(screen.getByText("Corte clásico"))
    await waitFor(() => screen.getByLabelText("Selecciona una fecha"))
    fireEvent.change(screen.getByLabelText("Selecciona una fecha"), {
      target: { value: "2025-06-01" },
    })
    await waitFor(() => screen.getByText("9:00 AM"))
    await user.click(screen.getByText("9:00 AM"))
    await user.click(screen.getByRole("button", { name: "Continuar" }))
    await waitFor(() => screen.getByText(/5 \/ 5/))
    return user
  }

  it("muestra el formulario de datos personales en el paso 5", async () => {
    mockFetch([businesses, chairs, services, slots])
    await goToStep5()
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument()
  })

  it("muestra error de validación cuando el nombre es muy corto", async () => {
    mockFetch([businesses, chairs, services, slots])
    const user = await goToStep5()
    const nameInput = screen.getByLabelText(/Nombre/i)
    await user.type(nameInput, "A")
    await user.click(screen.getByRole("button", { name: /Confirmar/i }))
    await waitFor(() => {
      expect(screen.getByText(/al menos 2 caracteres/i)).toBeInTheDocument()
    })
  })

  it("envía la reserva al completar el formulario", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => businesses } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => chairs } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => services } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => slots } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "booking-123" }) } as Response)

    const user = await goToStep5()
    await user.type(screen.getByLabelText(/Nombre/i), "Carlos Pérez")
    await user.type(screen.getByLabelText(/Teléfono/i), "61234567")
    await user.click(screen.getByRole("button", { name: /Confirmar/i }))
    await waitFor(() => {
      expect(screen.getByText("¡Reserva confirmada!")).toBeInTheDocument()
    })
  })

  it("muestra error cuando falla el envío", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => businesses } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => chairs } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => services } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => slots } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Horario no disponible" }) } as Response)

    const user = await goToStep5()
    await user.type(screen.getByLabelText(/Nombre/i), "Carlos Pérez")
    await user.type(screen.getByLabelText(/Teléfono/i), "61234567")
    await user.click(screen.getByRole("button", { name: /Confirmar/i }))
    await waitFor(() => {
      expect(screen.getByText("Horario no disponible")).toBeInTheDocument()
    })
  })

  it("vuelve al paso 4 al hacer clic en Atrás desde el paso 5", async () => {
    mockFetch([businesses, chairs, services, slots])
    const user = await goToStep5()
    await user.click(screen.getByText("Atrás"))
    await waitFor(() => {
      expect(screen.getByText(/4 \/ 5/)).toBeInTheDocument()
    })
  })

  it("muestra mensaje genérico de error cuando el servidor no retorna campo error", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => businesses } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => chairs } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => services } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => slots } as Response)
      .mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response)

    const user = await goToStep5()
    await user.type(screen.getByLabelText(/Nombre/i), "Carlos Pérez")
    await user.type(screen.getByLabelText(/Teléfono/i), "61234567")
    await user.click(screen.getByRole("button", { name: /Confirmar/i }))
    await waitFor(() => {
      expect(screen.getByText("Error al crear la reserva.")).toBeInTheDocument()
    })
  })
})

// ─── Paso 6: Confirmación ─────────────────────────────────────────────────────

describe("BookingWizard — Paso 6: Éxito", () => {
  it("muestra el código de referencia de la reserva", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => businesses } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => chairs } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => services } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => slots } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "REF-XYZ-123" }) } as Response)

    render(<BookingWizard />)
    const user = userEvent.setup()
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByText("Silla A"))
    await waitFor(() => screen.getByText("Corte clásico"))
    await user.click(screen.getByText("Corte clásico"))
    await waitFor(() => screen.getByLabelText("Selecciona una fecha"))
    fireEvent.change(screen.getByLabelText("Selecciona una fecha"), {
      target: { value: "2025-06-01" },
    })
    await waitFor(() => screen.getByText("9:00 AM"))
    await user.click(screen.getByText("9:00 AM"))
    await user.click(screen.getByRole("button", { name: "Continuar" }))
    await waitFor(() => screen.getByLabelText(/Nombre/i))
    await user.type(screen.getByLabelText(/Nombre/i), "Ana García")
    await user.type(screen.getByLabelText(/Teléfono/i), "61234567")
    await user.click(screen.getByRole("button", { name: /Confirmar/i }))
    await waitFor(() => {
      expect(screen.getByText("REF-XYZ-123")).toBeInTheDocument()
    })
  })

  it("permite hacer otra reserva desde la pantalla de éxito", async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => businesses } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => chairs } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => services } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => slots } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "booking-1" }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => businesses } as Response)

    render(<BookingWizard />)
    const user = userEvent.setup()
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    await waitFor(() => screen.getByText("Silla A"))
    await user.click(screen.getByText("Silla A"))
    await waitFor(() => screen.getByText("Corte clásico"))
    await user.click(screen.getByText("Corte clásico"))
    await waitFor(() => screen.getByLabelText("Selecciona una fecha"))
    fireEvent.change(screen.getByLabelText("Selecciona una fecha"), {
      target: { value: "2025-06-01" },
    })
    await waitFor(() => screen.getByText("9:00 AM"))
    await user.click(screen.getByText("9:00 AM"))
    await user.click(screen.getByRole("button", { name: "Continuar" }))
    await waitFor(() => screen.getByLabelText(/Nombre/i))
    await user.type(screen.getByLabelText(/Nombre/i), "Ana García")
    await user.type(screen.getByLabelText(/Teléfono/i), "61234567")
    await user.click(screen.getByRole("button", { name: /Confirmar/i }))
    await waitFor(() => screen.getByText("¡Reserva confirmada!"))
    await user.click(screen.getByRole("button", { name: "Hacer otra reserva" }))
    await waitFor(() => {
      expect(screen.getByText(/1 \/ 5/)).toBeInTheDocument()
    })
  })
})
