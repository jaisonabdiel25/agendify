/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}))

import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BusinessesSearch } from "@/components/modules/admin/businesses-search"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

const mockPush = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
  ;(usePathname as jest.Mock).mockReturnValue("/admin")
})

afterEach(() => {
  jest.useRealTimers()
})

describe("BusinessesSearch — renderizado", () => {
  it("muestra el campo de búsqueda", () => {
    render(<BusinessesSearch />)
    expect(screen.getByPlaceholderText("Buscar negocio...")).toBeInTheDocument()
  })

  it("inicializa vacío cuando no hay param search", () => {
    render(<BusinessesSearch />)
    expect(screen.getByPlaceholderText("Buscar negocio...")).toHaveValue("")
  })

  it("inicializa con el valor del param search", () => {
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("search=peluqueria"))
    render(<BusinessesSearch />)
    expect(screen.getByPlaceholderText("Buscar negocio...")).toHaveValue("peluqueria")
  })
})

describe("BusinessesSearch — debounce de navegación", () => {
  it("no navega inmediatamente al escribir", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessesSearch />)
    await user.type(screen.getByPlaceholderText("Buscar negocio..."), "test")
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("navega con el parámetro search después de 300ms", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessesSearch />)
    await user.type(screen.getByPlaceholderText("Buscar negocio..."), "test")
    act(() => jest.advanceTimersByTime(300))
    expect(mockPush).toHaveBeenCalledWith("/admin?search=test")
  })

  it("elimina el param search cuando el campo está vacío", async () => {
    ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams("search=test"))
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessesSearch />)
    await user.clear(screen.getByPlaceholderText("Buscar negocio..."))
    act(() => jest.advanceTimersByTime(300))
    expect(mockPush).toHaveBeenCalledWith("/admin?")
  })
})
