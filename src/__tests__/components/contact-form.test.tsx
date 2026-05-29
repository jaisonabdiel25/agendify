/**
 * @jest-environment jsdom
 */

jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.setTimeout(20000)

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ContactForm } from "@/components/modules/contact/contact-form"
import { toast } from "sonner"

const toastSuccessMock = toast.success as jest.Mock
const toastErrorMock = toast.error as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ ok: true }),
  } as Response)
})

async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{ email: string; phone: string; message: string }> = {}
) {
  const defaults = {
    email: "usuario@ejemplo.com",
    phone: "61234567",
    message: "Mensaje de prueba con suficientes caracteres",
  }
  const values = { ...defaults, ...overrides }
  await user.type(screen.getByLabelText("Correo electrónico"), values.email)
  await user.type(screen.getByLabelText("Número de celular"), values.phone)
  await user.type(screen.getByLabelText("Descripción / Mensaje"), values.message)
}

describe("ContactForm — renderizado", () => {
  it("muestra el campo de correo electrónico", () => {
    render(<ContactForm />)
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument()
  })

  it("muestra el campo de número de celular", () => {
    render(<ContactForm />)
    expect(screen.getByLabelText("Número de celular")).toBeInTheDocument()
  })

  it("muestra el campo de descripción / mensaje", () => {
    render(<ContactForm />)
    expect(screen.getByLabelText("Descripción / Mensaje")).toBeInTheDocument()
  })

  it("muestra el botón Enviar mensaje", () => {
    render(<ContactForm />)
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeInTheDocument()
  })
})

describe("ContactForm — validaciones", () => {
  it("muestra error con correo inválido", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user, { email: "no-es-correo" })
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect(screen.getByText("Ingresa un correo electrónico válido.")).toBeInTheDocument()
    })
  })

  it("muestra error con celular inválido", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user, { phone: "71234567" })
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect(screen.getByText(/iniciar con 6/i)).toBeInTheDocument()
    })
  })

  it("muestra error con mensaje muy corto", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user, { message: "Corto" })
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect(screen.getByText(/10 caracteres/i)).toBeInTheDocument()
    })
  })

  it("no llama a fetch cuando hay errores de validación", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user, { email: "invalido" })
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })
})

describe("ContactForm — submit exitoso", () => {
  it("llama a fetch con los datos correctos", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/contact",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      )
    })
  })

  it("muestra toast de éxito cuando el servidor responde ok", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith(expect.stringContaining("enviado"))
    })
  })

  it("resetea el formulario tras el envío exitoso", async () => {
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect((screen.getByLabelText("Correo electrónico") as HTMLInputElement).value).toBe("")
    })
  })
})

describe("ContactForm — error del servidor", () => {
  it("muestra toast de error cuando el servidor falla", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "No se pudo enviar el mensaje." }),
    } as Response)
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith("No se pudo enviar el mensaje.")
    })
  })

  it("muestra toast de error genérico cuando el servidor no devuelve mensaje", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)
    const user = userEvent.setup()
    render(<ContactForm />)
    await fillForm(user)
    await user.click(screen.getByRole("button", { name: "Enviar mensaje" }))
    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith(expect.stringContaining("Intenta de nuevo"))
    })
  })
})
