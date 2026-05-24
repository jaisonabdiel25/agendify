/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))
jest.mock("next-auth/react", () => ({ signIn: jest.fn() }))

jest.setTimeout(20000)

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RegisterForm } from "@/components/modules/auth/register-form"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

const signInMock = signIn as jest.Mock
const mockPush = jest.fn()
const mockRefresh = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush, refresh: mockRefresh })
  signInMock.mockResolvedValue({ error: null })
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: "user-1" }),
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

describe("RegisterForm — submit exitoso", () => {
  it("llama fetch con los datos correctos", async () => {
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

  it("llama signIn tras el registro exitoso", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("credentials", expect.objectContaining({
        email: "juan@test.com",
        redirect: false,
      }))
    })
  })

  it("redirige a /dashboard tras registro y login exitosos", async () => {
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"))
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

  it("muestra error cuando signIn falla después del registro", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin" })
    const user = userEvent.setup()
    render(<RegisterForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }))
    await waitFor(() => {
      expect(screen.getByText(/Cuenta creada/i)).toBeInTheDocument()
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
