/**
 * @jest-environment jsdom
 */

jest.mock("@/components/theme-toggle", () => ({
  ThemeToggle: () => null,
}))

import { render, screen } from "@testing-library/react"
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

  it("muestra los enlaces Iniciar sesión y Comenzar gratis en el menú móvil", async () => {
    const user = userEvent.setup()
    render(<LandingHeader />)
    await user.click(screen.getByLabelText("Abrir menú"))
    expect(screen.getByText("Comenzar gratis →")).toBeInTheDocument()
  })
})
