/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChairCard } from "@/components/modules/chair/chair-card"
import { useRouter } from "next/navigation"

const mockRefresh = jest.fn()

const chair = {
  id: "chair-1",
  name: "Silla A",
  description: "Especialidad en coloración",
  color: "#6366f1",
  isActive: true,
  userId: "user-1",
  user: { id: "user-1", name: "Ana García", email: "ana@test.com" },
}

const availableUsers = [
  { id: "user-2", name: "Pedro López", email: "pedro@test.com" },
]

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({}),
  } as Response)
})

describe("ChairCard — modo vista", () => {
  it("muestra el nombre del puesto", () => {
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    expect(screen.getByText("Silla A")).toBeInTheDocument()
  })

  it("muestra el usuario asignado", () => {
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    expect(screen.getByText(/Ana García/)).toBeInTheDocument()
  })

  it("muestra el color del puesto", () => {
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    expect(screen.getByText("#6366f1")).toBeInTheDocument()
  })

  it("muestra la descripción", () => {
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    expect(screen.getByText("Especialidad en coloración")).toBeInTheDocument()
  })

  it("muestra estado Activo", () => {
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    expect(screen.getByText("Activo")).toBeInTheDocument()
  })

  it("muestra estado Inactivo cuando isActive=false", () => {
    render(<ChairCard chair={{ ...chair, isActive: false }} availableUsers={availableUsers} />)
    expect(screen.getByText("Inactivo")).toBeInTheDocument()
  })

  it("muestra 'Sin asignar' cuando no hay usuario", () => {
    render(<ChairCard chair={{ ...chair, userId: null, user: null }} availableUsers={availableUsers} />)
    expect(screen.getByText("Sin asignar")).toBeInTheDocument()
  })

  it("muestra botón Editar", () => {
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    expect(screen.getByRole("button", { name: /Editar/i })).toBeInTheDocument()
  })
})

describe("ChairCard — modo edición", () => {
  it("muestra el formulario al hacer clic en Editar", async () => {
    const user = userEvent.setup()
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeInTheDocument()
  })

  it("el botón Guardar cambios está deshabilitado cuando no hay cambios", async () => {
    const user = userEvent.setup()
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled()
  })

  it("vuelve a modo vista al hacer clic en el Cancelar del header", async () => {
    const user = userEvent.setup()
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    const cancelBtns = screen.getAllByRole("button", { name: /Cancelar/i })
    await user.click(cancelBtns[0])
    expect(screen.getByRole("button", { name: /Editar/i })).toBeInTheDocument()
  })

  it("llama fetch PATCH al guardar cambios", async () => {
    const user = userEvent.setup()
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    const nameInput = screen.getByLabelText("Nombre *")
    await user.clear(nameInput)
    await user.type(nameInput, "Silla B")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/chairs/chair-1",
        expect.objectContaining({ method: "PATCH" })
      )
    })
  })

  it("cierra el formulario tras guardar exitosamente", async () => {
    const user = userEvent.setup()
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    const nameInput = screen.getByLabelText("Nombre *")
    await user.clear(nameInput)
    await user.type(nameInput, "Silla B")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it("muestra error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error al guardar" }),
    } as Response)
    const user = userEvent.setup()
    render(<ChairCard chair={chair} availableUsers={availableUsers} />)
    await user.click(screen.getByRole("button", { name: /Editar/i }))
    const nameInput = screen.getByLabelText("Nombre *")
    await user.clear(nameInput)
    await user.type(nameInput, "Silla B")
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }))
    await waitFor(() => {
      expect(screen.getByText("Error al guardar")).toBeInTheDocument()
    })
  })
})
