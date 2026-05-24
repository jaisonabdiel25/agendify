/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ usePathname: jest.fn() }))
jest.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-trigger">{children}</div>
  ),
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

import { render, screen } from "@testing-library/react"
import { usePathname } from "next/navigation"
import { MobileNav } from "@/components/modules/mobile-nav"

const pathnameMock = usePathname as jest.Mock

beforeEach(() => {
  pathnameMock.mockReturnValue("/dashboard")
})

// ──────────────────────────────────────────────────────────
// Botón hamburguesa
// ──────────────────────────────────────────────────────────
describe("MobileNav — botón hamburguesa", () => {
  it("renderiza el botón de menú", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("el botón tiene el texto accesible 'Abrir menú'", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.getByText("Abrir menú")).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────────────
// Enlaces principales (siempre visibles)
// ──────────────────────────────────────────────────────────
describe("MobileNav — enlaces principales", () => {
  it("muestra el enlace Calendario", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.getByText("Calendario")).toBeInTheDocument()
  })

  it("muestra el enlace Reservas", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.getByText("Reservas")).toBeInTheDocument()
  })

  it("muestra el enlace Cronograma", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.getByText("Cronograma")).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────────────
// Visibilidad condicional por rol
// ──────────────────────────────────────────────────────────
describe("MobileNav — visibilidad condicional por rol", () => {
  it("muestra Estadísticas cuando canManage es true", () => {
    render(<MobileNav canManage={true} />)
    expect(screen.getByText("Estadísticas")).toBeInTheDocument()
  })

  it("oculta Estadísticas cuando canManage es false", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.queryByText("Estadísticas")).not.toBeInTheDocument()
  })

  it("muestra la sección Gestión cuando canManage es true", () => {
    render(<MobileNav canManage={true} />)
    expect(screen.getByText("Gestión")).toBeInTheDocument()
  })

  it("oculta la sección Gestión cuando canManage es false", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.queryByText("Gestión")).not.toBeInTheDocument()
  })

  it("muestra los enlaces de gestión cuando canManage es true", () => {
    render(<MobileNav canManage={true} />)
    expect(screen.getByText("Puestos")).toBeInTheDocument()
    expect(screen.getByText("Servicios")).toBeInTheDocument()
    expect(screen.getByText("Negocio")).toBeInTheDocument()
  })

  it("oculta los enlaces de gestión cuando canManage es false", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.queryByText("Puestos")).not.toBeInTheDocument()
    expect(screen.queryByText("Servicios")).not.toBeInTheDocument()
    expect(screen.queryByText("Negocio")).not.toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────────────────
// hrefs de los enlaces
// ──────────────────────────────────────────────────────────
describe("MobileNav — hrefs de los enlaces", () => {
  it("Calendario apunta a /dashboard", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.getByText("Calendario").closest("a")).toHaveAttribute("href", "/dashboard")
  })

  it("Reservas apunta a /booking", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.getByText("Reservas").closest("a")).toHaveAttribute("href", "/booking")
  })

  it("Cronograma apunta a /schedule", () => {
    render(<MobileNav canManage={false} />)
    expect(screen.getByText("Cronograma").closest("a")).toHaveAttribute("href", "/schedule")
  })

  it("Estadísticas apunta a /statistics", () => {
    render(<MobileNav canManage={true} />)
    expect(screen.getByText("Estadísticas").closest("a")).toHaveAttribute("href", "/statistics")
  })

  it("Puestos apunta a /chair", () => {
    render(<MobileNav canManage={true} />)
    expect(screen.getByText("Puestos").closest("a")).toHaveAttribute("href", "/chair")
  })

  it("Servicios apunta a /service", () => {
    render(<MobileNav canManage={true} />)
    expect(screen.getByText("Servicios").closest("a")).toHaveAttribute("href", "/service")
  })

  it("Negocio apunta a /business", () => {
    render(<MobileNav canManage={true} />)
    expect(screen.getByText("Negocio").closest("a")).toHaveAttribute("href", "/business")
  })
})

// ──────────────────────────────────────────────────────────
// Estado activo del enlace
// ──────────────────────────────────────────────────────────
describe("MobileNav — estado activo del enlace", () => {
  it("el enlace activo recibe la clase bg-accent", () => {
    pathnameMock.mockReturnValue("/dashboard")
    render(<MobileNav canManage={false} />)
    const link = screen.getByText("Calendario").closest("a")
    expect(link?.className).toContain("bg-accent")
  })

  it("los enlaces inactivos no tienen bg-accent en la clase de fondo", () => {
    pathnameMock.mockReturnValue("/dashboard")
    render(<MobileNav canManage={false} />)
    const link = screen.getByText("Reservas").closest("a")
    expect(link?.className).not.toContain("bg-accent text-accent-foreground")
  })

  it("el enlace /booking es activo en rutas que comienzan con /booking/", () => {
    pathnameMock.mockReturnValue("/booking/123")
    render(<MobileNav canManage={false} />)
    const link = screen.getByText("Reservas").closest("a")
    expect(link?.className).toContain("bg-accent")
  })

  it("Cronograma es activo cuando la ruta es /schedule", () => {
    pathnameMock.mockReturnValue("/schedule")
    render(<MobileNav canManage={false} />)
    const link = screen.getByText("Cronograma").closest("a")
    expect(link?.className).toContain("bg-accent")
  })
})
