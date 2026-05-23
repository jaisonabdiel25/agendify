/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateServiceForm } from "@/components/modules/service/create-service-form"
import { useRouter } from "next/navigation"

const mockPush = jest.fn()
const mockRefresh = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: "srv-1" }),
  } as Response)
})

describe("CreateServiceForm — renderizado", () => {
  it("muestra el campo nombre", () => {
    render(<CreateServiceForm />)
    expect(screen.getByLabelText("Nombre *")).toBeInTheDocument()
  })

  it("muestra el campo duración", () => {
    render(<CreateServiceForm />)
    expect(screen.getByLabelText("Duración (minutos) *")).toBeInTheDocument()
  })

  it("muestra el campo precio", () => {
    render(<CreateServiceForm />)
    expect(screen.getByLabelText("Precio ($) *")).toBeInTheDocument()
  })

  it("muestra el toggle de servicio activo activado por defecto", () => {
    render(<CreateServiceForm />)
    const toggle = screen.getByRole("switch")
    expect(toggle).toHaveAttribute("aria-checked", "true")
  })

  it("muestra el botón Crear servicio", () => {
    render(<CreateServiceForm />)
    expect(screen.getByRole("button", { name: "Crear servicio" })).toBeInTheDocument()
  })
})

describe("CreateServiceForm — toggle de estado", () => {
  it("desactiva el toggle al hacer clic", async () => {
    const user = userEvent.setup()
    render(<CreateServiceForm />)
    const toggle = screen.getByRole("switch")
    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "false")
  })
})

describe("CreateServiceForm — submit exitoso", () => {
  it("llama fetch POST con los datos correctos", async () => {
    const user = userEvent.setup()
    render(<CreateServiceForm />)
    await user.type(screen.getByLabelText("Nombre *"), "Corte clásico")
    await user.type(screen.getByLabelText("Duración (minutos) *"), "30")
    await user.type(screen.getByLabelText("Precio ($) *"), "25")
    await user.click(screen.getByRole("button", { name: "Crear servicio" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/services",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("redirige a /service tras submit exitoso", async () => {
    const user = userEvent.setup()
    render(<CreateServiceForm />)
    await user.type(screen.getByLabelText("Nombre *"), "Corte clásico")
    await user.type(screen.getByLabelText("Duración (minutos) *"), "30")
    await user.type(screen.getByLabelText("Precio ($) *"), "25")
    await user.click(screen.getByRole("button", { name: "Crear servicio" }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/service"))
  })
})

describe("CreateServiceForm — error del servidor", () => {
  it("muestra error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Nombre ya existe" }),
    } as Response)
    const user = userEvent.setup()
    render(<CreateServiceForm />)
    await user.type(screen.getByLabelText("Nombre *"), "Corte clásico")
    await user.type(screen.getByLabelText("Duración (minutos) *"), "30")
    await user.type(screen.getByLabelText("Precio ($) *"), "25")
    await user.click(screen.getByRole("button", { name: "Crear servicio" }))
    await waitFor(() => {
      expect(screen.getByText("Nombre ya existe")).toBeInTheDocument()
    })
  })
})
