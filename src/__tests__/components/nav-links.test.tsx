/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }))
jest.mock("@/components/modules/nav-manage-dropdown", () => ({
  NavManageDropdown: () => null,
}))

import { render, screen } from "@testing-library/react"
import { usePathname } from "next/navigation"
import { NavLinks } from "@/components/modules/nav-links"

const pathnameMock = usePathname as jest.Mock

beforeEach(() => {
  pathnameMock.mockReturnValue("/dashboard")
})

describe("NavLinks — enlaces siempre visibles", () => {
  it("muestra el enlace Calendario", () => {
    render(<NavLinks canManage={false} />)
    expect(screen.getByText("Calendario")).toBeInTheDocument()
  })

  it("muestra el enlace Reservas", () => {
    render(<NavLinks canManage={false} />)
    expect(screen.getByText("Reservas")).toBeInTheDocument()
  })

  it("muestra el enlace Cronograma", () => {
    render(<NavLinks canManage={false} />)
    expect(screen.getByText("Cronograma")).toBeInTheDocument()
  })
})

describe("NavLinks — visibilidad condicional por rol", () => {
  it("muestra Estadísticas cuando canManage es true", () => {
    render(<NavLinks canManage={true} />)
    expect(screen.getByText("Estadísticas")).toBeInTheDocument()
  })

  it("oculta Estadísticas cuando canManage es false", () => {
    render(<NavLinks canManage={false} />)
    expect(screen.queryByText("Estadísticas")).not.toBeInTheDocument()
  })
})

describe("NavLinks — estado activo del enlace", () => {
  it("el enlace activo recibe la clase bg-accent", () => {
    pathnameMock.mockReturnValue("/dashboard")
    render(<NavLinks canManage={false} />)
    const link = screen.getByText("Calendario").closest("a")
    expect(link?.className).toContain("bg-accent")
  })

  it("los enlaces inactivos no tienen bg-accent como estado activo", () => {
    pathnameMock.mockReturnValue("/dashboard")
    render(<NavLinks canManage={false} />)
    const link = screen.getByText("Reservas").closest("a")
    expect(link?.className).not.toContain("text-foreground font-medium")
  })

  it("el enlace /booking es activo en rutas que comienzan con /booking/", () => {
    pathnameMock.mockReturnValue("/booking/123")
    render(<NavLinks canManage={false} />)
    const link = screen.getByText("Reservas").closest("a")
    expect(link?.className).toContain("bg-accent")
  })

  it("Cronograma es activo cuando la ruta es /schedule", () => {
    pathnameMock.mockReturnValue("/schedule")
    render(<NavLinks canManage={false} />)
    const link = screen.getByText("Cronograma").closest("a")
    expect(link?.className).toContain("bg-accent")
  })
})

describe("NavLinks — hrefs de los enlaces", () => {
  it("Calendario apunta a /dashboard", () => {
    render(<NavLinks canManage={false} />)
    expect(screen.getByText("Calendario").closest("a")).toHaveAttribute("href", "/dashboard")
  })

  it("Reservas apunta a /booking", () => {
    render(<NavLinks canManage={false} />)
    expect(screen.getByText("Reservas").closest("a")).toHaveAttribute("href", "/booking")
  })

  it("Cronograma apunta a /schedule", () => {
    render(<NavLinks canManage={false} />)
    expect(screen.getByText("Cronograma").closest("a")).toHaveAttribute("href", "/schedule")
  })

  it("Estadísticas apunta a /statistics", () => {
    render(<NavLinks canManage={true} />)
    expect(screen.getByText("Estadísticas").closest("a")).toHaveAttribute("href", "/statistics")
  })
})
