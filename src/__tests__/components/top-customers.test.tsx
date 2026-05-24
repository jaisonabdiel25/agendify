/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TopCustomers } from "@/components/modules/statistics/top-customers"
import type { CustomerRow } from "@/components/modules/statistics/types"

function makeCustomer(i: number): CustomerRow {
  return {
    customerId: `c-${i}`,
    name: `Cliente ${i}`,
    email: null,
    phone: null,
    totalBookings: i * 2,
    totalSpent: (i * 50).toFixed(2),
  }
}

describe("TopCustomers — estado vacío", () => {
  it("muestra mensaje cuando no hay datos", () => {
    render(<TopCustomers data={[]} />)
    expect(screen.getByText("Sin reservas en este período")).toBeInTheDocument()
  })

  it("muestra la descripción genérica sin clientes", () => {
    render(<TopCustomers data={[]} />)
    expect(screen.getByText(/Top clientes por reservas/i)).toBeInTheDocument()
  })
})

describe("TopCustomers — con datos", () => {
  it("muestra el nombre del primer cliente", () => {
    render(<TopCustomers data={[makeCustomer(1)]} />)
    expect(screen.getByText("Cliente 1")).toBeInTheDocument()
  })

  it("muestra el total de reservas del cliente", () => {
    render(<TopCustomers data={[makeCustomer(3)]} />)
    expect(screen.getByText("6")).toBeInTheDocument()
  })

  it("muestra la descripción con cantidad de clientes", () => {
    render(<TopCustomers data={[makeCustomer(1), makeCustomer(2)]} />)
    expect(screen.getByText(/2 clientes/i)).toBeInTheDocument()
  })

  it("muestra los encabezados de la tabla", () => {
    render(<TopCustomers data={[makeCustomer(1)]} />)
    expect(screen.getByText("Cliente")).toBeInTheDocument()
    expect(screen.getByText("Reservas")).toBeInTheDocument()
    expect(screen.getByText("Total gastado")).toBeInTheDocument()
  })
})

describe("TopCustomers — paginación", () => {
  const manyCustomers = Array.from({ length: 8 }, (_, i) => makeCustomer(i + 1))

  it("no muestra paginación cuando hay 5 o menos clientes", () => {
    render(<TopCustomers data={manyCustomers.slice(0, 5)} />)
    expect(screen.queryByLabelText("Página anterior")).not.toBeInTheDocument()
  })

  it("muestra paginación cuando hay más de 5 clientes", () => {
    render(<TopCustomers data={manyCustomers} />)
    expect(screen.getByLabelText("Página anterior")).toBeInTheDocument()
    expect(screen.getByLabelText("Página siguiente")).toBeInTheDocument()
  })

  it("el botón anterior está deshabilitado en la primera página", () => {
    render(<TopCustomers data={manyCustomers} />)
    expect(screen.getByLabelText("Página anterior")).toBeDisabled()
  })

  it("navega a la siguiente página al hacer clic en siguiente", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={manyCustomers} />)
    await user.click(screen.getByLabelText("Página siguiente"))
    expect(screen.getByText("Cliente 6")).toBeInTheDocument()
  })

  it("el botón siguiente está deshabilitado en la última página", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={manyCustomers} />)
    await user.click(screen.getByLabelText("Página siguiente"))
    expect(screen.getByLabelText("Página siguiente")).toBeDisabled()
  })

  it("el botón anterior está habilitado en la segunda página", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={manyCustomers} />)
    await user.click(screen.getByLabelText("Página siguiente"))
    expect(screen.getByLabelText("Página anterior")).not.toBeDisabled()
  })

  it("muestra el rango correcto en la primera página", () => {
    render(<TopCustomers data={manyCustomers} />)
    expect(screen.getByText("1–5 de 8")).toBeInTheDocument()
  })
})
