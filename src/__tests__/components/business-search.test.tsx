/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockPush = jest.fn()

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BusinessSearch } from "@/components/modules/reserve/business-search"

const results = [
  { id: "biz-1", name: "Barbería Central", slug: "barberia-central", address: "Calle 50, Panamá" },
  { id: "biz-2", name: "Salon Luna", slug: "salon-luna", address: null },
]

function mockFetch(data: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => data,
  } as Response)
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.runOnlyPendingTimers()
  jest.useRealTimers()
})

describe("BusinessSearch", () => {
  it("renderiza el input de búsqueda", () => {
    render(<BusinessSearch />)
    expect(screen.getByRole("combobox", { name: /buscar negocio/i })).toBeInTheDocument()
  })

  it("muestra el título principal", () => {
    render(<BusinessSearch />)
    expect(screen.getByText(/¿En qué negocio/i)).toBeInTheDocument()
  })

  it("muestra el mensaje de acceso por link cuando el input está vacío", () => {
    render(<BusinessSearch />)
    expect(screen.getByText(/link que te compartió/i)).toBeInTheDocument()
  })

  it("no hace fetch cuando el input está vacío", async () => {
    mockFetch(results)
    render(<BusinessSearch />)
    jest.runAllTimers()
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("hace fetch con ?q= después del debounce al escribir", async () => {
    mockFetch(results)
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessSearch />)
    const input = screen.getByRole("combobox", { name: /buscar negocio/i })
    await user.type(input, "Barber")
    jest.advanceTimersByTime(300)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("q=Barber")
      )
    })
  })

  it("muestra los resultados de búsqueda", async () => {
    mockFetch(results)
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessSearch />)
    await user.type(screen.getByRole("combobox", { name: /buscar negocio/i }), "Barber")
    jest.advanceTimersByTime(300)
    await waitFor(() => {
      expect(screen.getByText("Barbería Central")).toBeInTheDocument()
      expect(screen.getByText("Salon Luna")).toBeInTheDocument()
    })
  })

  it("muestra la dirección del negocio cuando está disponible", async () => {
    mockFetch(results)
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessSearch />)
    await user.type(screen.getByRole("combobox", { name: /buscar negocio/i }), "Barber")
    jest.advanceTimersByTime(300)
    await waitFor(() => {
      expect(screen.getByText("Calle 50, Panamá")).toBeInTheDocument()
    })
  })

  it("muestra mensaje cuando no hay resultados", async () => {
    mockFetch([])
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessSearch />)
    await user.type(screen.getByRole("combobox", { name: /buscar negocio/i }), "xyzinexistente")
    jest.advanceTimersByTime(300)
    await waitFor(() => {
      expect(screen.getByText(/No encontramos negocios/i)).toBeInTheDocument()
    })
  })

  it("navega a /reserve/[slug] al seleccionar un resultado", async () => {
    mockFetch(results)
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessSearch />)
    await user.type(screen.getByRole("combobox", { name: /buscar negocio/i }), "Barber")
    jest.advanceTimersByTime(300)
    await waitFor(() => screen.getByText("Barbería Central"))
    await user.click(screen.getByText("Barbería Central"))
    expect(mockPush).toHaveBeenCalledWith("/reserve/barberia-central")
  })

  it("oculta el mensaje de link al escribir en el input", async () => {
    mockFetch(results)
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<BusinessSearch />)
    expect(screen.getByText(/link que te compartió/i)).toBeInTheDocument()
    await user.type(screen.getByRole("combobox", { name: /buscar negocio/i }), "B")
    expect(screen.queryByText(/link que te compartió/i)).not.toBeInTheDocument()
  })
})
