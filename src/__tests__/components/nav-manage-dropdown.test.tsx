/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NavManageDropdown } from "@/components/modules/nav-manage-dropdown"

describe("NavManageDropdown — renderizado", () => {
  it("muestra el trigger Gestión", () => {
    render(<NavManageDropdown />)
    expect(screen.getByText("Gestión")).toBeInTheDocument()
  })

  it("no muestra los ítems del menú antes de abrir", () => {
    render(<NavManageDropdown />)
    expect(screen.queryByText("Puestos")).not.toBeInTheDocument()
  })
})

describe("NavManageDropdown — abrir menú", () => {
  it("muestra los ítems al hacer clic en Gestión", async () => {
    const user = userEvent.setup()
    render(<NavManageDropdown />)
    await user.click(screen.getByText("Gestión"))
    expect(screen.getByText("Puestos")).toBeInTheDocument()
    expect(screen.getByText("Servicios")).toBeInTheDocument()
    expect(screen.getByText("Equipo")).toBeInTheDocument()
    expect(screen.getByText("Negocio")).toBeInTheDocument()
  })

  it("el ítem Puestos tiene href /chair", async () => {
    const user = userEvent.setup()
    render(<NavManageDropdown />)
    await user.click(screen.getByText("Gestión"))
    expect(screen.getByText("Puestos").closest("a")).toHaveAttribute("href", "/chair")
  })

  it("el ítem Servicios tiene href /service", async () => {
    const user = userEvent.setup()
    render(<NavManageDropdown />)
    await user.click(screen.getByText("Gestión"))
    expect(screen.getByText("Servicios").closest("a")).toHaveAttribute("href", "/service")
  })

  it("el ítem Equipo tiene href /user/admin", async () => {
    const user = userEvent.setup()
    render(<NavManageDropdown />)
    await user.click(screen.getByText("Gestión"))
    expect(screen.getByText("Equipo").closest("a")).toHaveAttribute("href", "/user/admin")
  })

  it("el ítem Negocio tiene href /business", async () => {
    const user = userEvent.setup()
    render(<NavManageDropdown />)
    await user.click(screen.getByText("Gestión"))
    expect(screen.getByText("Negocio").closest("a")).toHaveAttribute("href", "/business")
  })
})
