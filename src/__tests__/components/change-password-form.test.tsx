/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChangePasswordForm } from "@/components/modules/user/change-password-form"

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

describe("ChangePasswordForm — modo lectura", () => {
  it("muestra los puntos de contraseña oculta", () => {
    render(<ChangePasswordForm />)

    expect(screen.getByText("••••••••")).toBeInTheDocument()
  })

  it("muestra el botón Cambiar contraseña en modo lectura", () => {
    render(<ChangePasswordForm />)

    expect(screen.getByRole("button", { name: /cambiar contraseña/i })).toBeInTheDocument()
  })

  it("no muestra los campos del formulario en modo lectura", () => {
    render(<ChangePasswordForm />)

    expect(screen.queryByLabelText(/contraseña actual/i)).not.toBeInTheDocument()
  })
})

describe("ChangePasswordForm — modo edición", () => {
  it("al hacer clic en Cambiar contraseña se muestran los campos del formulario", async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.click(screen.getByRole("button", { name: /cambiar contraseña/i }))

    expect(screen.getByLabelText(/contraseña actual/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^nueva contraseña/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirmar nueva contraseña/i)).toBeInTheDocument()
  })

  it("el botón Guardar está deshabilitado si no hay cambios", async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.click(screen.getByRole("button", { name: /cambiar contraseña/i }))

    expect(screen.getByRole("button", { name: /guardar/i })).toBeDisabled()
  })

  it("Cancelar vuelve a modo lectura sin llamar fetch", async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.click(screen.getByRole("button", { name: /cambiar contraseña/i }))
    await user.click(screen.getAllByRole("button", { name: /cancelar/i })[0])

    expect(screen.queryByLabelText(/contraseña actual/i)).not.toBeInTheDocument()
    expect(screen.getByText("••••••••")).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("muestra error de validación cuando las contraseñas no coinciden", async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.click(screen.getByRole("button", { name: /cambiar contraseña/i }))

    fireEvent.change(screen.getByLabelText(/contraseña actual/i), { target: { value: "current123" } })
    fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: "newPassword123" } })
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "different456" } })

    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText(/no coinciden/i)).toBeInTheDocument()
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("muestra error de validación cuando la nueva contraseña es muy corta", async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm />)

    await user.click(screen.getByRole("button", { name: /cambiar contraseña/i }))

    fireEvent.change(screen.getByLabelText(/contraseña actual/i), { target: { value: "current123" } })
    fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: "short" } })
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "short" } })

    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText(/8 caracteres/i)).toBeInTheDocument()
    })
  })

  it("vuelve a modo lectura tras una respuesta 200 exitosa", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Contraseña actualizada correctamente" }),
    })

    render(<ChangePasswordForm />)

    await user.click(screen.getByRole("button", { name: /cambiar contraseña/i }))

    fireEvent.change(screen.getByLabelText(/contraseña actual/i), { target: { value: "current123" } })
    fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: "newPassword123" } })
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "newPassword123" } })

    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.queryByLabelText(/contraseña actual/i)).not.toBeInTheDocument()
    })
    expect(screen.getByText("••••••••")).toBeInTheDocument()
    expect(screen.getByText(/actualizada correctamente/i)).toBeInTheDocument()
  })

  it("muestra error del servidor y permanece en modo edición", async () => {
    const user = userEvent.setup()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Contraseña actual incorrecta" }),
    })

    render(<ChangePasswordForm />)

    await user.click(screen.getByRole("button", { name: /cambiar contraseña/i }))

    fireEvent.change(screen.getByLabelText(/contraseña actual/i), { target: { value: "wrongPass" } })
    fireEvent.change(screen.getByLabelText(/^nueva contraseña/i), { target: { value: "newPassword123" } })
    fireEvent.change(screen.getByLabelText(/confirmar nueva contraseña/i), { target: { value: "newPassword123" } })

    await user.click(screen.getByRole("button", { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText(/contraseña actual incorrecta/i)).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/contraseña actual/i)).toBeInTheDocument()
  })
})
