/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TopCustomers } from "@/components/modules/statistics/top-customers"
import type { CustomerRow } from "@/components/modules/statistics/types"

function makeCustomers(count: number): CustomerRow[] {
  return Array.from({ length: count }, (_, i) => ({
    customerId: `c${i + 1}`,
    name: `Cliente ${i + 1}`,
    totalBookings: count - i,
    totalSpent: ((count - i) * 25).toFixed(2),
  }))
}

describe("TopCustomers — estado vacío", () => {
  it("muestra el mensaje sin reservas cuando no hay datos", () => {
    render(<TopCustomers data={[]} />)
    expect(screen.getByText(/Sin reservas en este período/i)).toBeInTheDocument()
  })

  it("no renderiza la tabla cuando no hay datos", () => {
    render(<TopCustomers data={[]} />)
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })
})

describe("TopCustomers — renderizado con datos", () => {
  it("muestra los encabezados de la tabla", () => {
    render(<TopCustomers data={makeCustomers(1)} />)
    expect(screen.getByText("Cliente")).toBeInTheDocument()
    expect(screen.getByText("Reservas")).toBeInTheDocument()
    expect(screen.getByText("Total gastado")).toBeInTheDocument()
  })

  it("muestra los nombres de los clientes", () => {
    render(<TopCustomers data={makeCustomers(3)} />)
    expect(screen.getByText("Cliente 1")).toBeInTheDocument()
    expect(screen.getByText("Cliente 2")).toBeInTheDocument()
    expect(screen.getByText("Cliente 3")).toBeInTheDocument()
  })

  it("muestra el número de reservas de cada cliente", () => {
    // Valores de bookings intencionalmente distintos a los rangos de rank (1, 2)
    const data: CustomerRow[] = [
      { customerId: "c1", name: "Ana", totalBookings: 7, totalSpent: "175.00" },
      { customerId: "c2", name: "Luis", totalBookings: 4, totalSpent: "100.00" },
    ]
    render(<TopCustomers data={data} />)
    expect(screen.getByText("7")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("muestra la descripción con el total de clientes", () => {
    render(<TopCustomers data={makeCustomers(7)} />)
    expect(screen.getByText(/7 clientes/)).toBeInTheDocument()
  })
})

describe("TopCustomers — sin paginación", () => {
  it("no muestra controles de paginación con exactamente 5 registros", () => {
    render(<TopCustomers data={makeCustomers(5)} />)
    expect(screen.queryByLabelText("Página anterior")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Página siguiente")).not.toBeInTheDocument()
  })

  it("no muestra controles de paginación con menos de 5 registros", () => {
    render(<TopCustomers data={makeCustomers(3)} />)
    expect(screen.queryByLabelText("Página anterior")).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Página siguiente")).not.toBeInTheDocument()
  })
})

describe("TopCustomers — paginación", () => {
  it("muestra controles de paginación con más de 5 registros", () => {
    render(<TopCustomers data={makeCustomers(6)} />)
    expect(screen.getByLabelText("Página anterior")).toBeInTheDocument()
    expect(screen.getByLabelText("Página siguiente")).toBeInTheDocument()
  })

  it("muestra solo los primeros 5 registros en la primera página", () => {
    render(<TopCustomers data={makeCustomers(8)} />)
    expect(screen.getByText("Cliente 1")).toBeInTheDocument()
    expect(screen.getByText("Cliente 5")).toBeInTheDocument()
    expect(screen.queryByText("Cliente 6")).not.toBeInTheDocument()
  })

  it("el botón anterior está deshabilitado en la primera página", () => {
    render(<TopCustomers data={makeCustomers(8)} />)
    expect(screen.getByLabelText("Página anterior")).toBeDisabled()
  })

  it("el botón siguiente está habilitado en la primera página", () => {
    render(<TopCustomers data={makeCustomers(8)} />)
    expect(screen.getByLabelText("Página siguiente")).not.toBeDisabled()
  })

  it("navega a la segunda página al hacer clic en siguiente", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={makeCustomers(8)} />)

    await user.click(screen.getByLabelText("Página siguiente"))

    expect(screen.getByText("Cliente 6")).toBeInTheDocument()
    expect(screen.queryByText("Cliente 1")).not.toBeInTheDocument()
  })

  it("el botón siguiente está deshabilitado en la última página", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={makeCustomers(6)} />)

    await user.click(screen.getByLabelText("Página siguiente"))

    expect(screen.getByLabelText("Página siguiente")).toBeDisabled()
  })

  it("regresa a la primera página al hacer clic en anterior", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={makeCustomers(8)} />)

    await user.click(screen.getByLabelText("Página siguiente"))
    await user.click(screen.getByLabelText("Página anterior"))

    expect(screen.getByText("Cliente 1")).toBeInTheDocument()
    expect(screen.queryByText("Cliente 6")).not.toBeInTheDocument()
  })

  it("muestra el contador de páginas correcto en la primera página", () => {
    render(<TopCustomers data={makeCustomers(8)} />)
    expect(screen.getByText("1 / 2")).toBeInTheDocument()
  })

  it("muestra el contador de páginas actualizado al navegar", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={makeCustomers(8)} />)

    await user.click(screen.getByLabelText("Página siguiente"))

    expect(screen.getByText("2 / 2")).toBeInTheDocument()
  })

  it("muestra el rango de registros en la primera página", () => {
    render(<TopCustomers data={makeCustomers(8)} />)
    expect(screen.getByText(/1–5 de 8/)).toBeInTheDocument()
  })

  it("muestra el rango de registros correcto en la última página", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={makeCustomers(8)} />)

    await user.click(screen.getByLabelText("Página siguiente"))

    expect(screen.getByText(/6–8 de 8/)).toBeInTheDocument()
  })

  it("muestra la numeración de fila correcta al paginar", async () => {
    const user = userEvent.setup()
    render(<TopCustomers data={makeCustomers(8)} />)

    await user.click(screen.getByLabelText("Página siguiente"))

    // En página 2, el primer registro debe ser #6
    expect(screen.getByText("6")).toBeInTheDocument()
  })
})
