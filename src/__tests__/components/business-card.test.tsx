/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BusinessCard } from "@/components/modules/business/business-card"
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

const invitation = {
  id: "inv-1",
  code: "ABCD-1234",
  createdAt: "2025-01-15T00:00:00.000Z",
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  })
})

describe("BusinessCard — modo vista", () => {
  it("muestra el nombre del negocio", () => {
    render(<BusinessCard business={business} invitation={null} />)
    expect(screen.getByText("Mi Barbería")).toBeInTheDocument()
  })

  it("muestra el slug del negocio", () => {
    render(<BusinessCard business={business} invitation={null} />)
    expect(screen.getByText("mi-barberia")).toBeInTheDocument()
  })

  it("muestra la zona horaria", () => {
    render(<BusinessCard business={business} invitation={null} />)
    expect(screen.getByText("America/Panama")).toBeInTheDocument()
  })

  it("muestra el botón Editar", () => {
    render(<BusinessCard business={business} invitation={null} />)
    expect(screen.getByRole("button", { name: /Editar/i })).toBeInTheDocument()
  })
})

describe("BusinessCard — código de invitación", () => {
  it("muestra el código de invitación cuando existe", () => {
    render(<BusinessCard business={business} invitation={invitation} />)
    expect(screen.getByText("ABCD-1234")).toBeInTheDocument()
  })

  it("muestra mensaje cuando no hay código de invitación", () => {
    render(<BusinessCard business={business} invitation={null} />)
    expect(screen.getByText("No hay código de invitación activo.")).toBeInTheDocument()
  })

  it("muestra botón para generar nuevo código", () => {
    render(<BusinessCard business={business} invitation={null} />)
    expect(screen.getByRole("button", { name: /Generar nuevo código/i })).toBeInTheDocument()
  })

  it("genera nuevo código al hacer clic en Generar nuevo código", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "inv-2", code: "WXYZ-5678", createdAt: "2025-06-01T00:00:00.000Z" }),
    } as Response)
    const user = userEvent.setup()
    render(<BusinessCard business={business} invitation={null} />)
    await user.click(screen.getByRole("button", { name: /Generar nuevo código/i }))
    await waitFor(() => {
      expect(screen.getByText("WXYZ-5678")).toBeInTheDocument()
    })
  })

  it("copia el código al portapapeles", async () => {
    const user = userEvent.setup()
    const writeTextMock = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })
    render(<BusinessCard business={business} invitation={invitation} />)
    await user.click(screen.getByTitle("Copiar código"))
    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("ABCD-1234")
    })
  })
})

describe("BusinessCard — modo edición", () => {
  it("muestra el formulario al hacer clic en Editar", async () => {
    const user = userEvent.setup()
    render(<BusinessCard business={business} invitation={null} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    expect(screen.getByLabelText("Nombre del negocio *")).toBeInTheDocument()
  })

  it("el formulario tiene el nombre pre-cargado", async () => {
    const user = userEvent.setup()
    render(<BusinessCard business={business} invitation={null} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    expect(screen.getByLabelText("Nombre del negocio *")).toHaveValue("Mi Barbería")
  })

  it("vuelve a modo vista al hacer clic en Cancelar", async () => {
    const user = userEvent.setup()
    render(<BusinessCard business={business} invitation={null} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    const cancelBtns = screen.getAllByRole("button", { name: /Cancelar/i })
    await user.click(cancelBtns[0])
    expect(screen.getByRole("button", { name: /Editar/i })).toBeInTheDocument()
  })

  it("llama fetch PATCH al guardar", async () => {
    const user = userEvent.setup()
    render(<BusinessCard business={business} invitation={null} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    const nameInput = screen.getByLabelText("Nombre del negocio *")
    await user.clear(nameInput)
    await user.type(nameInput, "Nueva Barbería")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/business",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("muestra error cuando el servidor falla al guardar", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error al guardar" }),
    } as Response)
    const user = userEvent.setup()
    render(<BusinessCard business={business} invitation={null} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    const nameInput = screen.getByLabelText("Nombre del negocio *")
    await user.clear(nameInput)
    await user.type(nameInput, "Nueva Barbería")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(screen.getByText("Error al guardar")).toBeInTheDocument()
    })
  })
})
