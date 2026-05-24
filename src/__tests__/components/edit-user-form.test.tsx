/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRouter } from "next/navigation"
import { UserProfileCard } from "@/components/modules/user/edit-user-form"

const mockRefresh = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn()
})

const defaultUser = {
  id: "user-1",
  name: "Jaison",
  description: "Desarrollador",
}

describe("UserProfileCard — vista informativa", () => {
  it("muestra el nombre y la descripción en modo lectura", () => {
    render(<UserProfileCard user={defaultUser} />)

    expect(screen.getByText("Jaison")).toBeInTheDocument()
    expect(screen.getByText("Desarrollador")).toBeInTheDocument()
  })

  it("muestra un guión cuando la descripción es null", () => {
    render(<UserProfileCard user={{ ...defaultUser, description: null }} />)

    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("no muestra el formulario en modo lectura", () => {
    render(<UserProfileCard user={defaultUser} />)

    expect(screen.queryByRole("textbox", { name: /nombre/i })).not.toBeInTheDocument()
  })

  it("muestra el botón Editar en modo lectura", () => {
    render(<UserProfileCard user={defaultUser} />)

    expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument()
  })
})

describe("UserProfileCard — modo edición", () => {
  it("al hacer clic en Editar se muestran los campos del formulario", async () => {
    const user = userEvent.setup()
    render(<UserProfileCard user={defaultUser} />)

    await user.click(screen.getByRole("button", { name: /editar/i }))

    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument()
  })

  it("los campos se pre-rellenan con los valores actuales", async () => {
    const user = userEvent.setup()
    render(<UserProfileCard user={defaultUser} />)

    await user.click(screen.getByRole("button", { name: /editar/i }))

    expect(screen.getByLabelText(/nombre/i)).toHaveValue("Jaison")
    expect(screen.getByLabelText(/descripción/i)).toHaveValue("Desarrollador")
  })

  it("el botón Guardar está deshabilitado si no hay cambios", async () => {
    const user = userEvent.setup()
    render(<UserProfileCard user={defaultUser} />)

    await user.click(screen.getByRole("button", { name: /editar/i }))

    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled()
  })

  it("Cancelar vuelve a modo lectura sin guardar", async () => {
    const user = userEvent.setup()
    render(<UserProfileCard user={defaultUser} />)

    await user.click(screen.getByRole("button", { name: /editar/i }))
    // En modo edición hay dos botones Cancelar (header y formulario); ambos hacen lo mismo
    await user.click(screen.getAllByRole("button", { name: /cancelar/i })[0])

    expect(screen.queryByLabelText(/nombre/i)).not.toBeInTheDocument()
    expect(screen.getByText("Jaison")).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("muestra error de validación con nombre muy corto", async () => {
    const user = userEvent.setup()
    render(<UserProfileCard user={defaultUser} />)

    await user.click(screen.getByRole("button", { name: /editar/i }))

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "A" } })

    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText(/2 caracteres/i)).toBeInTheDocument()
    })
  })

  it("guarda correctamente y vuelve a modo lectura", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: "user-1", name: "Jaison Palacio", description: "Dev" }),
    })

    render(<UserProfileCard user={defaultUser} />)

    await user.click(screen.getByRole("button", { name: /editar/i }))

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Jaison Palacio" } })

    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.queryByLabelText(/nombre/i)).not.toBeInTheDocument()
    })
    expect(mockRefresh).toHaveBeenCalled()
  })

  it("muestra error del servidor y permanece en modo edición", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error interno del servidor" }),
    })

    render(<UserProfileCard user={defaultUser} />)

    await user.click(screen.getByRole("button", { name: /editar/i }))

    fireEvent.change(screen.getByLabelText(/nombre/i), { target: { value: "Jaison Palacio" } })

    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText(/error interno del servidor/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
