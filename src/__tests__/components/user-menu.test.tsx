/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { UserMenu } from "@/components/modules/user-menu"

const signOutAction = jest.fn()

describe("UserMenu — iniciales", () => {
  it("muestra las iniciales de nombre y apellido", () => {
    render(<UserMenu userName="Juan Pérez" signOutAction={signOutAction} />)
    expect(screen.getByText("JP")).toBeInTheDocument()
  })

  it("muestra solo la inicial cuando el nombre es simple", () => {
    render(<UserMenu userName="María" signOutAction={signOutAction} />)
    expect(screen.getByText("M")).toBeInTheDocument()
  })

  it("usa solo las dos primeras partes del nombre", () => {
    render(<UserMenu userName="Ana María García" signOutAction={signOutAction} />)
    expect(screen.getByText("AM")).toBeInTheDocument()
  })

  it("muestra las iniciales en mayúsculas", () => {
    render(<UserMenu userName="juan pérez" signOutAction={signOutAction} />)
    expect(screen.getByText("JP")).toBeInTheDocument()
  })
})

describe("UserMenu — primer nombre", () => {
  it("muestra el primer nombre del usuario", () => {
    render(<UserMenu userName="Juan Pérez" signOutAction={signOutAction} />)
    expect(screen.getByText("Juan")).toBeInTheDocument()
  })
})

describe("UserMenu — dropdown", () => {
  it("muestra el nombre completo al abrir el menú", async () => {
    const user = userEvent.setup()
    render(<UserMenu userName="Juan Pérez" signOutAction={signOutAction} />)
    await user.click(screen.getByText("Juan"))
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
  })

  it("muestra la opción Cerrar sesión al abrir el menú", async () => {
    const user = userEvent.setup()
    render(<UserMenu userName="Juan Pérez" signOutAction={signOutAction} />)
    await user.click(screen.getByText("Juan"))
    expect(screen.getByText("Cerrar sesión")).toBeInTheDocument()
  })
})
