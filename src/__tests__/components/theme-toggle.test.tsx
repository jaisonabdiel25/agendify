/**
 * @jest-environment jsdom
 */

jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}))

import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"

const useThemeMock = useTheme as jest.Mock

describe("ThemeToggle — antes de montar (SSR)", () => {
  it("muestra el ícono Moon antes de que el componente se monte (estado inicial)", () => {
    useThemeMock.mockReturnValue({ theme: "light", setTheme: jest.fn() })
    render(<ThemeToggle />)
    expect(screen.getByLabelText("Cambiar tema")).toBeInTheDocument()
  })
})

describe("ThemeToggle — tema claro", () => {
  it("muestra el ícono Moon en tema claro (mounted)", async () => {
    const setTheme = jest.fn()
    useThemeMock.mockReturnValue({ theme: "light", setTheme })
    render(<ThemeToggle />)
    await act(async () => {})
    expect(screen.getByLabelText("Cambiar tema")).toBeInTheDocument()
  })

  it("cambia a tema oscuro al hacer clic en tema claro", async () => {
    const setTheme = jest.fn()
    useThemeMock.mockReturnValue({ theme: "light", setTheme })
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await act(async () => {})
    await user.click(screen.getByLabelText("Cambiar tema"))
    expect(setTheme).toHaveBeenCalledWith("dark")
  })
})

describe("ThemeToggle — tema oscuro", () => {
  it("cambia a tema claro al hacer clic en tema oscuro", async () => {
    const setTheme = jest.fn()
    useThemeMock.mockReturnValue({ theme: "dark", setTheme })
    const user = userEvent.setup()
    render(<ThemeToggle />)
    await act(async () => {})
    await user.click(screen.getByLabelText("Cambiar tema"))
    expect(setTheme).toHaveBeenCalledWith("light")
  })
})
