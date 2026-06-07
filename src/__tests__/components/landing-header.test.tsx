/**
 * @jest-environment jsdom
 */

jest.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => null,
}))

import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { LandingHeader } from "@/components/landing-header"

describe("LandingHeader — elementos siempre visibles", () => {
  it("muestra el logo Agendify", () => {
    render(<LandingHeader />)
    expect(screen.getByText("Agendify")).toBeInTheDocument()
  })

  it("el logo enlaza a la raíz /", () => {
    render(<LandingHeader />)
    expect(screen.getByText("Agendify").closest("a")).toHaveAttribute("href", "/")
  })
})

describe("LandingHeader — menú móvil", () => {
  it("el menú móvil está cerrado por defecto (sin links de acción visibles)", () => {
    render(<LandingHeader />)
    expect(screen.queryByLabelText("Cerrar menú")).not.toBeInTheDocument()
    expect(screen.getByLabelText("Abrir menú")).toBeInTheDocument()
  })

  it("abre el menú móvil al hacer clic en el botón hamburguesa", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    expect(screen.getByLabelText("Cerrar menú")).toBeInTheDocument()
  })

  it("cierra el menú móvil al hacer clic en el botón de cerrar", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    await user.click(screen.getByLabelText("Cerrar menú"))
    expect(screen.getByLabelText("Abrir menú")).toBeInTheDocument()
  })

  it("muestra el enlace Iniciar sesión en el menú móvil abierto", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    const loginLinks = screen.getAllByText("Iniciar sesión")
    expect(loginLinks.length).toBeGreaterThanOrEqual(1)
  })

  it("cierra el menú al hacer clic en el enlace Características del menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    const caracteristicasLinks = screen.getAllByText("Características")
    const mobileLink = caracteristicasLinks[caracteristicasLinks.length - 1]
    await user.click(mobileLink)
    expect(screen.queryByLabelText("Cerrar menú")).not.toBeInTheDocument()
  })

  it("muestra el enlace Comenzar ahora en el menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    expect(screen.getByText("Comenzar ahora →")).toBeInTheDocument()
  })

  it("muestra el enlace Contáctanos en el menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    const links = screen.getAllByText("Contáctanos")
    expect(links.length).toBeGreaterThanOrEqual(1)
  })

  it("cierra el menú al hacer clic en el enlace Precios del menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    const preciosLinks = screen.getAllByText("Precios")
    await user.click(preciosLinks[preciosLinks.length - 1])
    expect(screen.queryByLabelText("Cerrar menú")).not.toBeInTheDocument()
  })

  it("cierra el menú al hacer clic en el enlace Reservar cita del menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    const reservarLinks = screen.getAllByText("Reservar cita")
    await user.click(reservarLinks[reservarLinks.length - 1])
    expect(screen.queryByLabelText("Cerrar menú")).not.toBeInTheDocument()
  })

  it("cierra el menú al hacer clic en el enlace Iniciar sesión del menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    const loginLinks = screen.getAllByText("Iniciar sesión")
    await user.click(loginLinks[loginLinks.length - 1])
    expect(screen.queryByLabelText("Cerrar menú")).not.toBeInTheDocument()
  })

  it("cierra el menú al hacer clic en el enlace Contáctanos del menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    const contactLinks = screen.getAllByText("Contáctanos")
    await user.click(contactLinks[contactLinks.length - 1])
    expect(screen.queryByLabelText("Cerrar menú")).not.toBeInTheDocument()
  })

  it("cierra el menú al hacer clic en el enlace Comenzar ahora del menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    await user.click(screen.getByText("Comenzar ahora →"))
    expect(screen.queryByLabelText("Cerrar menú")).not.toBeInTheDocument()
  })
})

describe("LandingHeader — scroll awareness", () => {
  beforeEach(() => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: jest.fn(() => 0),
    })
  })

  it("no tiene shadow-sm en el estado inicial (sin scroll)", () => {
    render(<LandingHeader />)
    const header = screen.getByRole("banner")
    expect(header.className).not.toContain("shadow-sm")
  })

  it("aplica shadow-sm al header cuando scrollY > 10", () => {
    render(<LandingHeader />)
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: jest.fn(() => 20),
    })
    act(() => {
      window.dispatchEvent(new Event("scroll"))
    })
    const header = screen.getByRole("banner")
    expect(header.className).toContain("shadow-sm")
  })

  it("elimina shadow-sm al volver a scrollY <= 10", () => {
    render(<LandingHeader />)
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: jest.fn(() => 20),
    })
    act(() => {
      window.dispatchEvent(new Event("scroll"))
    })
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: jest.fn(() => 0),
    })
    act(() => {
      window.dispatchEvent(new Event("scroll"))
    })
    const header = screen.getByRole("banner")
    expect(header.className).not.toContain("shadow-sm")
  })

  it("registra el listener de scroll con { passive: true } al montar", () => {
    const addSpy = jest.spyOn(window, "addEventListener")
    render(<LandingHeader />)
    expect(addSpy).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true })
    addSpy.mockRestore()
  })

  it("elimina el listener de scroll al desmontar", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener")
    const { unmount } = render(<LandingHeader />)
    unmount()
    expect(removeSpy).toHaveBeenCalledWith("scroll", expect.any(Function))
    removeSpy.mockRestore()
  })
})
