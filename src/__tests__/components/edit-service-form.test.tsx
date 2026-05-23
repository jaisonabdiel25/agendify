/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditServiceForm } from "@/components/modules/service/edit-service-form"
import { useRouter } from "next/navigation"

const mockPush = jest.fn()
const mockRefresh = jest.fn()

const service = {
  id: "srv-1",
  name: "Corte clásico",
  description: "Descripción del servicio",
  durationMinutes: 30,
  price: "25.00",
  color: "#185FA5",
  isActive: true,
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
})

describe("EditServiceForm — renderizado", () => {
  it("muestra el nombre pre-cargado", () => {
    render(<EditServiceForm service={service} />)
    expect(screen.getByLabelText("Nombre *")).toHaveValue("Corte clásico")
  })

  it("muestra la duración pre-cargada", () => {
    render(<EditServiceForm service={service} />)
    expect(screen.getByLabelText("Duración (minutos) *")).toHaveValue(30)
  })

  it("muestra el precio pre-cargado", () => {
    render(<EditServiceForm service={service} />)
    expect(screen.getByLabelText("Precio ($) *")).toHaveValue(25)
  })

  it("muestra el toggle activo cuando isActive=true", () => {
    render(<EditServiceForm service={service} />)
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
  })

  it("muestra el toggle inactivo cuando isActive=false", () => {
    render(<EditServiceForm service={{ ...service, isActive: false }} />)
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false")
  })

  it("muestra el botón Guardar cambios", () => {
    render(<EditServiceForm service={service} />)
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
  })
})

describe("EditServiceForm — toggle de estado", () => {
  it("cambia el estado del toggle al hacer clic", async () => {
    const user = userEvent.setup()
    render(<EditServiceForm service={service} />)
    const toggle = screen.getByRole("switch")
    await user.click(toggle)
    expect(toggle).toHaveAttribute("aria-checked", "false")
  })
})

describe("EditServiceForm — submit exitoso", () => {
  it("llama fetch PATCH con los datos", async () => {
    const user = userEvent.setup()
    render(<EditServiceForm service={service} />)
    await user.clear(screen.getByLabelText("Nombre *"))
    await user.type(screen.getByLabelText("Nombre *"), "Corte moderno")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/services/srv-1",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("redirige a /service tras guardar exitosamente", async () => {
    const user = userEvent.setup()
    render(<EditServiceForm service={service} />)
    await user.clear(screen.getByLabelText("Nombre *"))
    await user.type(screen.getByLabelText("Nombre *"), "Corte moderno")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/service"))
  })
})

describe("EditServiceForm — error del servidor", () => {
  it("muestra error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error al actualizar" }),
    } as Response)
    const user = userEvent.setup()
    render(<EditServiceForm service={service} />)
    await user.clear(screen.getByLabelText("Nombre *"))
    await user.type(screen.getByLabelText("Nombre *"), "Corte moderno")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(screen.getByText("Error al actualizar")).toBeInTheDocument()
    })
  })
})
