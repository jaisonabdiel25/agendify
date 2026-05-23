/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateBusinessForm } from "@/components/modules/admin/create-business-form"
import { useRouter } from "next/navigation"

const mockRefresh = jest.fn()
;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: "biz-1", name: "Test", slug: "test" }),
  } as Response)
})

describe("CreateBusinessForm — renderizado", () => {
  it("muestra el campo de nombre", () => {
    render(<CreateBusinessForm />)
    expect(screen.getByLabelText("Nombre del negocio")).toBeInTheDocument()
  })

  it("muestra el botón Crear negocio", () => {
    render(<CreateBusinessForm />)
    expect(screen.getByRole("button", { name: "Crear negocio" })).toBeInTheDocument()
  })
})

describe("CreateBusinessForm — submit exitoso", () => {
  it("llama fetch con el nombre correcto", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/admin/businesses",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "Mi Barbería" }),
        })
      )
    })
  })

  it("muestra mensaje de éxito al crear el negocio", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(screen.getByText("Negocio creado correctamente.")).toBeInTheDocument()
    })
  })

  it("llama router.refresh() tras crear el negocio", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })
})

describe("CreateBusinessForm — error del servidor", () => {
  it("muestra el error cuando el servidor responde con un error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Ya existe ese negocio." }),
    } as Response)
    const user = userEvent.setup()
    render(<CreateBusinessForm />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(screen.getByText("Ya existe ese negocio.")).toBeInTheDocument()
    })
  })

  it("muestra error genérico si la respuesta no tiene body.error", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)
    const user = userEvent.setup()
    render(<CreateBusinessForm />)
    await user.type(screen.getByLabelText("Nombre del negocio"), "Mi Barbería")
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(screen.getByText("Error al crear el negocio.")).toBeInTheDocument()
    })
  })
})

describe("CreateBusinessForm — validación", () => {
  it("no llama a fetch cuando el nombre está vacío", async () => {
    const user = userEvent.setup()
    render(<CreateBusinessForm />)
    await user.click(screen.getByRole("button", { name: "Crear negocio" }))
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
