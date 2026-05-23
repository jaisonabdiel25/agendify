/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CreateChairForm } from "@/components/modules/chair/create-chair-form"
import { useRouter } from "next/navigation"

const mockPush = jest.fn()
const mockRefresh = jest.fn()

const users = [
  { id: "user-1", name: "Ana García", email: "ana@test.com" },
  { id: "user-2", name: "Pedro López", email: "pedro@test.com" },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: "chair-1" }),
  } as Response)
})

describe("CreateChairForm — renderizado", () => {
  it("muestra el campo de nombre", () => {
    render(<CreateChairForm users={users} />)
    expect(screen.getByLabelText("Nombre *")).toBeInTheDocument()
  })

  it("muestra el campo de descripción", () => {
    render(<CreateChairForm users={users} />)
    expect(screen.getByLabelText("Descripción")).toBeInTheDocument()
  })

  it("muestra el campo de color", () => {
    render(<CreateChairForm users={users} />)
    expect(screen.getByLabelText("Color del puesto")).toBeInTheDocument()
  })

  it("muestra el botón Crear puesto", () => {
    render(<CreateChairForm users={users} />)
    expect(screen.getByRole("button", { name: "Crear puesto" })).toBeInTheDocument()
  })

  it("muestra los usuarios disponibles en el select", () => {
    render(<CreateChairForm users={users} />)
    expect(screen.getByText("Ana García · ana@test.com")).toBeInTheDocument()
    expect(screen.getByText("Pedro López · pedro@test.com")).toBeInTheDocument()
  })

  it("muestra mensaje cuando no hay usuarios", () => {
    render(<CreateChairForm users={[]} />)
    expect(screen.getByText(/No hay usuarios disponibles/i)).toBeInTheDocument()
  })
})

describe("CreateChairForm — validación", () => {
  it("muestra error cuando el nombre es demasiado corto", async () => {
    const user = userEvent.setup()
    render(<CreateChairForm users={users} />)
    await user.type(screen.getByLabelText("Nombre *"), "A")
    await user.click(screen.getByRole("button", { name: "Crear puesto" }))
    await waitFor(() => {
      expect(screen.getByText("El nombre debe tener al menos 2 caracteres")).toBeInTheDocument()
    })
  })

  it("no llama fetch cuando hay errores de validación", async () => {
    const user = userEvent.setup()
    render(<CreateChairForm users={users} />)
    await user.type(screen.getByLabelText("Nombre *"), "A")
    await user.click(screen.getByRole("button", { name: "Crear puesto" }))
    await waitFor(() => expect(screen.getByText("El nombre debe tener al menos 2 caracteres")).toBeInTheDocument())
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe("CreateChairForm — submit exitoso", () => {
  it("llama fetch POST con los datos correctos", async () => {
    const user = userEvent.setup()
    render(<CreateChairForm users={users} />)
    await user.type(screen.getByLabelText("Nombre *"), "Silla A")
    await user.click(screen.getByRole("button", { name: "Crear puesto" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chairs",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("redirige a /chair tras submit exitoso", async () => {
    const user = userEvent.setup()
    render(<CreateChairForm users={users} />)
    await user.type(screen.getByLabelText("Nombre *"), "Silla A")
    await user.click(screen.getByRole("button", { name: "Crear puesto" }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/chair"))
  })
})

describe("CreateChairForm — error del servidor", () => {
  it("muestra error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Nombre ya existe" }),
    } as Response)
    const user = userEvent.setup()
    render(<CreateChairForm users={users} />)
    await user.type(screen.getByLabelText("Nombre *"), "Silla A")
    await user.click(screen.getByRole("button", { name: "Crear puesto" }))
    await waitFor(() => {
      expect(screen.getByText("Nombre ya existe")).toBeInTheDocument()
    })
  })
})
