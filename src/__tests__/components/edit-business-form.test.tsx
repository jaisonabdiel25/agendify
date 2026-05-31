/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { EditBusinessForm } from "@/components/modules/business/edit-business-form"
import { useRouter } from "next/navigation"

const mockRefresh = jest.fn()

const business = {
  id: "biz-1",
  name: "Mi Barbería",
  slug: "mi-barberia",
  phone: "+507 6000-0000",
  email: "barberia@test.com",
  timezone: "America/Panama",
  address: "Calle 50, Panamá",
  createdAt: "2025-01-01T00:00:00.000Z",
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
})

describe("EditBusinessForm — renderizado", () => {
  it("muestra el nombre pre-cargado", () => {
    render(<EditBusinessForm business={business} />)
    expect(screen.getByLabelText("Nombre del negocio *")).toHaveValue("Mi Barbería")
  })

  it("muestra la zona horaria pre-cargada", () => {
    render(<EditBusinessForm business={business} />)
    expect(screen.getByLabelText("Zona horaria *")).toHaveValue("America/Panama")
  })

  it("muestra el teléfono pre-cargado", () => {
    render(<EditBusinessForm business={business} />)
    expect(screen.getByLabelText("Teléfono")).toHaveValue("+507 6000-0000")
  })

  it("muestra el correo pre-cargado", () => {
    render(<EditBusinessForm business={business} />)
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("barberia@test.com")
  })

  it("muestra botón Guardar cambios deshabilitado inicialmente (sin cambios)", () => {
    render(<EditBusinessForm business={business} />)
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled()
  })
})

describe("EditBusinessForm — validación", () => {
  it("muestra error cuando el nombre está vacío", async () => {
    const user = userEvent.setup()
    render(<EditBusinessForm business={business} />)
    await user.clear(screen.getByLabelText("Nombre del negocio *"))
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(screen.getByText("El nombre debe tener al menos 2 caracteres")).toBeInTheDocument()
    })
  })
})

describe("EditBusinessForm — submit exitoso", () => {
  it("llama fetch PATCH con los datos correctos", async () => {
    const user = userEvent.setup()
    render(<EditBusinessForm business={business} />)
    await user.clear(screen.getByLabelText("Nombre del negocio *"))
    await user.type(screen.getByLabelText("Nombre del negocio *"), "Nueva Barbería")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/business",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("muestra mensaje de éxito tras guardar", async () => {
    const user = userEvent.setup()
    render(<EditBusinessForm business={business} />)
    await user.clear(screen.getByLabelText("Nombre del negocio *"))
    await user.type(screen.getByLabelText("Nombre del negocio *"), "Nueva Barbería")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(screen.getByText("Cambios guardados correctamente.")).toBeInTheDocument()
    })
  })

  it("llama router.refresh tras guardar exitosamente", async () => {
    const user = userEvent.setup()
    render(<EditBusinessForm business={business} />)
    await user.clear(screen.getByLabelText("Nombre del negocio *"))
    await user.type(screen.getByLabelText("Nombre del negocio *"), "Nueva Barbería")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })
})

describe("EditBusinessForm — error del servidor", () => {
  it("muestra error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Nombre ya existe" }),
    } as Response)
    const user = userEvent.setup()
    render(<EditBusinessForm business={business} />)
    await user.clear(screen.getByLabelText("Nombre del negocio *"))
    await user.type(screen.getByLabelText("Nombre del negocio *"), "Nueva Barbería")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(screen.getByText("Nombre ya existe")).toBeInTheDocument()
    })
  })

  it("muestra error genérico cuando el servidor falla sin body.error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)
    const user = userEvent.setup()
    render(<EditBusinessForm business={business} />)
    await user.clear(screen.getByLabelText("Nombre del negocio *"))
    await user.type(screen.getByLabelText("Nombre del negocio *"), "Nueva Barbería")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(screen.getByText("Error al guardar los cambios.")).toBeInTheDocument()
    })
  })
})

describe("EditBusinessForm — negocio sin datos opcionales", () => {
  it("renderiza correctamente con phone y email nulos", () => {
    const businessSinDatos = { ...business, phone: null, email: null, address: null }
    render(<EditBusinessForm business={businessSinDatos} />)
    expect(screen.getByLabelText("Nombre del negocio *")).toHaveValue("Mi Barbería")
    expect(screen.getByLabelText("Teléfono")).toHaveValue("")
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue("")
  })
})

describe("EditBusinessForm — error con body no parseable", () => {
  it("muestra error genérico cuando response.json() lanza excepción", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => { throw new Error("parse error") },
    } as unknown as Response)
    const user = userEvent.setup()
    render(<EditBusinessForm business={business} />)
    await user.clear(screen.getByLabelText("Nombre del negocio *"))
    await user.type(screen.getByLabelText("Nombre del negocio *"), "Nuevo Nombre")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(screen.getByText("Error al guardar los cambios.")).toBeInTheDocument()
    })
  })
})
