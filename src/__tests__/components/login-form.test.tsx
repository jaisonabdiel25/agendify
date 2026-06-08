/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))
jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  getSession: jest.fn(),
}))

import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LoginForm } from "@/components/login-form"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"

const signInMock = signIn as jest.Mock
const getSessionMock = getSession as jest.Mock
const routerMock = useRouter as jest.Mock
const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockReplace = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  routerMock.mockReturnValue({ push: mockPush, refresh: mockRefresh, replace: mockReplace })
  signInMock.mockResolvedValue({ error: null, code: null })
  getSessionMock.mockResolvedValue({ user: { role: "STAFF" } })
})

describe("LoginForm — renderizado", () => {
  it("muestra el campo de correo electrónico", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
  })

  it("muestra el campo de contraseña", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument()
  })

  it("muestra el botón de iniciar sesión", () => {
    render(<LoginForm />)
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument()
  })

  it("el campo de contraseña es de tipo password por defecto", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password")
  })
})

describe("LoginForm — toggle de contraseña", () => {
  it("muestra la contraseña al hacer clic en el botón mostrar", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByLabelText("Mostrar contraseña"))
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "text")
  })

  it("oculta la contraseña al hacer clic de nuevo", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByLabelText("Mostrar contraseña"))
    await user.click(screen.getByLabelText("Ocultar contraseña"))
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password")
  })
})

describe("LoginForm — validación del formulario", () => {
  it("no llama a signIn cuando el email tiene formato inválido", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByPlaceholderText("tu@empresa.com"), "no-email")
    await user.type(screen.getByPlaceholderText("••••••••"), "pass123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(signInMock).not.toHaveBeenCalled()
    })
  })

  it("no llama a signIn cuando la contraseña está vacía", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByPlaceholderText("tu@empresa.com"), "user@test.com")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(signInMock).not.toHaveBeenCalled()
    })
  })
})

describe("LoginForm — manejo de respuestas del servidor", () => {
  it("muestra error de negocio inactivo cuando code es inactive_business", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin", code: "inactive_business" })
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(screen.getByText(/negocio no está activo/i)).toBeInTheDocument()
    })
  })

  it("muestra el paso de verificación cuando code es inactive_user", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin", code: "inactive_user" })
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument()
    })
  })

  it("muestra el email en el paso de verificación", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin", code: "inactive_user" })
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(screen.getByText("user@test.com")).toBeInTheDocument()
    })
  })

  it("llama POST a /api/auth/verify-email con email y code al verificar desde login", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin", code: "inactive_user" })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText("Código de verificación"), "123456")
    await user.click(screen.getByRole("button", { name: "Verificar código" }))
    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]) => url === "/api/auth/verify-email"
      )
      expect(calls).toHaveLength(1)
      const body = JSON.parse(calls[0][1].body)
      expect(body.email).toBe("user@test.com")
      expect(body.code).toBe("123456")
    })
  })

  it("redirige a /login?verified=true y vuelve al login tras verificación exitosa", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin", code: "inactive_user" })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument()
    })
    await user.type(screen.getByLabelText("Código de verificación"), "123456")
    await user.click(screen.getByRole("button", { name: "Verificar código" }))
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?verified=true")
      expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument()
    })
  })

  it("llama a /api/auth/resend-verification con el email al reenviar desde login", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin", code: "inactive_user" })
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Reenviar código" })).toBeInTheDocument()
    })
    await user.click(screen.getByRole("button", { name: "Reenviar código" }))
    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]) => url === "/api/auth/resend-verification"
      )
      expect(calls).toHaveLength(1)
      const body = JSON.parse(calls[0][1].body)
      expect(body.email).toBe("user@test.com")
    })
  })

  it("vuelve al formulario de login al hacer clic en Volver al inicio de sesión", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin", code: "inactive_user" })
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Volver al inicio de sesión" })).toBeInTheDocument()
    })
    await user.click(screen.getByRole("button", { name: "Volver al inicio de sesión" }))
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument()
  })

  it("muestra error de credenciales incorrectas cuando signIn retorna error genérico", async () => {
    signInMock.mockResolvedValue({ error: "CredentialsSignin", code: null })
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "wrongpassword")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(screen.getByText(/Credenciales incorrectas/i)).toBeInTheDocument()
    })
  })

  it("redirige a /dashboard al iniciar sesión como STAFF", async () => {
    signInMock.mockResolvedValue({ error: null, code: null })
    getSessionMock.mockResolvedValue({ user: { role: "STAFF" } })
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "user@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "password123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard")
    })
  })

  it("redirige a /admin al iniciar sesión como ADMIN", async () => {
    signInMock.mockResolvedValue({ error: null, code: null })
    getSessionMock.mockResolvedValue({ user: { role: "ADMIN" } })
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.type(screen.getByLabelText("Correo electrónico"), "admin@test.com")
    await user.type(screen.getByLabelText("Contraseña"), "adminpass123")
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }))
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/admin")
    })
  })
})

describe("LoginForm — flujo ¿Olvidaste tu contraseña?", () => {
  it("muestra el paso forgot al hacer clic en ¿Olvidaste tu contraseña?", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => {
      expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument()
    })
  })

  it("vuelve al login al hacer clic en Volver al inicio de sesión desde forgot", async () => {
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Volver al inicio de sesión" })).toBeInTheDocument()
    )
    await user.click(screen.getByRole("button", { name: "Volver al inicio de sesión" }))
    expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument()
  })

  it("llama a /api/auth/forgot-password con el email y avanza al paso forgot-code", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "test@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls.filter(
        ([url]) => url === "/api/auth/forgot-password"
      )
      expect(calls).toHaveLength(1)
      expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument()
    })
  })

  it("muestra error si el fetch de forgot-password falla", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("Network error"))
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "test@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() => {
      expect(screen.getByText(/Error al enviar/i)).toBeInTheDocument()
    })
  })

  it("en forgot-code: muestra el email del usuario", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() => {
      expect(screen.getByText("ana@test.com")).toBeInTheDocument()
    })
  })

  it("en forgot-code: redirige a /login?reset=true tras reset exitoso", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() => expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "123456" } })
    await user.type(screen.getByLabelText("Nueva contraseña"), "nuevapass123")
    await user.type(screen.getByLabelText("Confirmar contraseña"), "nuevapass123")
    await user.click(screen.getByRole("button", { name: "Restablecer contraseña" }))
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login?reset=true")
      expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument()
    })
  })

  it("en forgot-code: muestra error si las contraseñas no coinciden", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() => expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "123456" } })
    await user.type(screen.getByLabelText("Nueva contraseña"), "nuevapass123")
    await user.type(screen.getByLabelText("Confirmar contraseña"), "diferente123")
    await user.click(screen.getByRole("button", { name: "Restablecer contraseña" }))
    await waitFor(() => {
      expect(screen.getByText(/contraseñas no coinciden/i)).toBeInTheDocument()
    })
  })

  it("en forgot-code: muestra error del servidor si el reset falla", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Código inválido o expirado." }),
      } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() => expect(screen.getByLabelText("Código de verificación")).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText("Código de verificación"), { target: { value: "999999" } })
    await user.type(screen.getByLabelText("Nueva contraseña"), "nuevapass123")
    await user.type(screen.getByLabelText("Confirmar contraseña"), "nuevapass123")
    await user.click(screen.getByRole("button", { name: "Restablecer contraseña" }))
    await waitFor(() => {
      expect(screen.getByText(/Código inválido o expirado/i)).toBeInTheDocument()
    })
  })

  it("en forgot-code: Volver a intentar regresa al paso forgot", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Volver a intentar" })).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: "Volver a intentar" }))
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument()
    })
  })

  it("en forgot-code: Volver al inicio de sesión resetea el estado", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "Volver al inicio de sesión" })[0]).toBeInTheDocument()
    )
    await user.click(screen.getAllByRole("button", { name: "Volver al inicio de sesión" })[0])
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Iniciar sesión" })).toBeInTheDocument()
    })
  })

  it("en forgot-code: toggle de visibilidad de contraseña funciona", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) } as Response)
    const user = userEvent.setup()
    render(<LoginForm />)
    await user.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Enviar código" })).toBeInTheDocument())
    await user.type(screen.getByLabelText("Correo electrónico"), "ana@test.com")
    await user.click(screen.getByRole("button", { name: "Enviar código" }))
    await waitFor(() => expect(screen.getByLabelText("Nueva contraseña")).toBeInTheDocument())
    expect(screen.getByLabelText("Nueva contraseña")).toHaveAttribute("type", "password")
    // Hay dos botones de toggle (password y confirm), tomamos el primero
    await user.click(screen.getAllByLabelText("Mostrar contraseña")[0])
    expect(screen.getByLabelText("Nueva contraseña")).toHaveAttribute("type", "text")
    await user.click(screen.getAllByLabelText("Ocultar contraseña")[0])
    expect(screen.getByLabelText("Nueva contraseña")).toHaveAttribute("type", "password")
  })
})
