/**
 * @jest-environment jsdom
 */

const mockPush = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({ push: mockPush })),
}))

jest.setTimeout(20000)

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RegisterForm } from "@/components/modules/auth/register-form"

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true, message: "Revisa tu correo para activar tu cuenta." }),
  } as Response)
})

async function fillForm(user: ReturnType<typeof userEvent.setup>, overrides: Record<string, string> = {}) {
  const defaults = {
    invitationCode: "ABCD-1234",
    name: "Juan Pérez",
    email: "juan@test.com",
    password: "password123",
    confirmPassword: "password123",
  }
  const values = { ...defaults, ...overrides }
  await user.type(screen.getByLabelText("Código de invitación"), values.invitationCode)
  await user.type(screen.getByLabelText("Tu nombre"), values.name)
  await user.type(screen.getByLabelText("Correo electrónico"), values.email)
  const passwordInputs = screen.getAllByLabelText("Contraseña")
  const confirmInputs = screen.getAllByLabelText("Confirmar contraseña")
  await user.type(passwordInputs[passwordInputs.length - 1], values.password)
  await user.type(confirmInputs[confirmInputs.length - 1], values.confirmPassword)
}

describe("RegisterForm — renderizado", () => {
  it("muestra el campo de código de invitación", () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText("Código de invitación")).toBeInTheDocument()
  })

  it("muestra el campo de nombre", () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText("Tu nombre")).toBeInTheDocument()
  })

  it("muestra el campo de correo electrónico", () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
  })

  it("muestra el botón Crear cuenta", () => {
    render(<RegisterForm />)
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeInTheDocument()
  })
})

describe("RegisterForm — toggle de contraseña", () => {
  it("los campos de contraseña son type=password por defecto", () => {
    render(<RegisterForm />)
    const passwordField = screen.getByPlaceholderText("Mínimo 8 caracteres")
    expect(passwordField).toHaveAttribute("type", "password")
  })

  it("muestra la contraseña al hacer clic en Mostrar contraseña", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    const toggleBtns = screen.getAllByLabelText("Mostrar contraseña")
    await user.click(toggleBtns[0])
    expect(screen.getByPlaceholderText("Mínimo 8 caracteres")).toHaveAttribute("type", "text")
  })

  it("oculta la contraseña al hacer clic de nuevo (toggle password)", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    const toggleBtns = screen.getAllByLabelText("Mostrar contraseña")
    await user.click(toggleBtns[0])
    await user.click(screen.getByLabelText("Ocultar contraseña"))
    expect(screen.getByPlaceholderText("Mínimo 8 caracteres")).toHaveAttribute("type", "password")
  })

  it("muestra el campo de confirmar contraseña al hacer clic en su toggle", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    const toggleBtns = screen.getAllByLabelText("Mostrar contraseña")
    await user.click(toggleBtns[1])
    expect(screen.getByPlaceholderText("Repite tu contraseña")).toHaveAttribute("type", "text")
  })

  it("oculta el campo de confirmar contraseña al hacer clic de nuevo", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    const toggleBtns = screen.getAllByLabelText("Mostrar contraseña")
    await user.click(toggleBtns[1])
    const hideBtns = screen.getAllByLabelText("Ocultar contraseña")
    await user.click(hideBtns[hideBtns.length - 1])
    expect(screen.getByPlaceholderText("Repite tu contraseña")).toHaveAttribute("type", "password")
  })
})

describe("RegisterForm — submit exitoso (paso de verificación)", () => {
  it("llama fetch con los datos correctos al registrar", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.objectContaining({ method: "POST" })
      )
    })
  })

  it("muestra el input de código tras registro exitoso", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument()
    })
  })

  it("muestra el email del usuario en la pantalla de verificación", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByText("juan@test.com")).toBeInTheDocument()
    })
  })

  it("muestra el botón Verificar código", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Verificar código" })).toBeInTheDocument()
    })
  })

  it("llama POST a /api/auth/verify-email con email y code al verificar", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument()
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "483920" } })
    await user.click(screen.getByRole("button", { name: "Verificar código" }))

    await waitFor(() => {
      const verifyCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]) => url === "/api/auth/verify-email"
      )
      expect(verifyCalls).toHaveLength(1)
      const body = JSON.parse(verifyCalls[0][1].body)
      expect(body.email).toBe("juan@test.com")
      expect(body.code).toBe("483920")
    })
  })

  it("llama router.push a /login?verified=true tras verificación exitosa", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument()
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "483920" } })
    await user.click(screen.getByRole("button", { name: "Verificar código" }))

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login?verified=true")
    })
  })

  it("muestra error cuando el código es incorrecto", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument()
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Código inválido." }),
    } as Response)

    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "000000" } })
    await user.click(screen.getByRole("button", { name: "Verificar código" }))

    await waitFor(() => {
      expect(screen.getByText("Código inválido.")).toBeInTheDocument()
    })
  })

  it("restaura el formulario al hacer clic en Volver al formulario", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Volver al formulario" })).toBeInTheDocument()
    })
    await user.click(screen.getByRole("button", { name: "Volver al formulario" }))
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeInTheDocument()
  })
})

describe("RegisterForm — reenvío de código", () => {
  it("muestra botón Reenviar código en la pantalla de verificación", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reenviar código" })).toBeInTheDocument()
    })
  })

  it("llama a /api/auth/resend-verification con el email al hacer clic en Reenviar código", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reenviar código" })).toBeInTheDocument()
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    await user.click(screen.getByRole("button", { name: "Reenviar código" }))

    await waitFor(() => {
      const resendCalls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]) => url === "/api/auth/resend-verification"
      )
      expect(resendCalls).toHaveLength(1)
      const body = JSON.parse(resendCalls[0][1].body)
      expect(body.email).toBe("juan@test.com")
    })
  })

  it("muestra mensaje de confirmación tras reenviar", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reenviar código" })).toBeInTheDocument()
    })

    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    await user.click(screen.getByRole("button", { name: "Reenviar código" }))

    await waitFor(() => {
      expect(screen.getByText("Te enviamos un nuevo código.")).toBeInTheDocument()
    })
  })
})

describe("RegisterForm — errores", () => {
  it("muestra error del servidor cuando el registro falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Código inválido" }),
    } as Response)
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByText("Código inválido")).toBeInTheDocument()
    })
  })

  it("no llama a fetch cuando las contraseñas no coinciden", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user, { confirmPassword: "differentpass" })
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})
