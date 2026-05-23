/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}))

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BusinessesPagination } from "@/components/modules/admin/businesses-pagination"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

const mockPush = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
  ;(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams())
  ;(usePathname as jest.Mock).mockReturnValue("/admin")
})

describe("BusinessesPagination — sin paginación", () => {
  it("no renderiza nada cuando solo hay 1 página", () => {
    const { container } = render(
      <BusinessesPagination total={5} pageSize={10} currentPage={1} />
    )
    expect(container.firstChild).toBeNull()
  })

  it("no renderiza nada cuando total es 0", () => {
    const { container } = render(
      <BusinessesPagination total={0} pageSize={10} currentPage={1} />
    )
    expect(container.firstChild).toBeNull()
  })
})

describe("BusinessesPagination — con paginación", () => {
  it("muestra la información de página", () => {
    render(<BusinessesPagination total={15} pageSize={10} currentPage={1} />)
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument()
    expect(screen.getByText(/15 negocios/)).toBeInTheDocument()
  })

  it("el botón anterior está deshabilitado en página 1", () => {
    render(<BusinessesPagination total={15} pageSize={10} currentPage={1} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[0]).toBeDisabled()
  })

  it("el botón siguiente está deshabilitado en la última página", () => {
    render(<BusinessesPagination total={15} pageSize={10} currentPage={2} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons[1]).toBeDisabled()
  })

  it("navega a la página 2 al hacer clic en siguiente desde página 1", async () => {
    const user = userEvent.setup()
    render(<BusinessesPagination total={15} pageSize={10} currentPage={1} />)
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[1])
    expect(mockPush).toHaveBeenCalledWith("/admin?page=2")
  })

  it("navega a la página 1 al hacer clic en anterior desde página 2", async () => {
    const user = userEvent.setup()
    render(<BusinessesPagination total={15} pageSize={10} currentPage={2} />)
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[0])
    expect(mockPush).toHaveBeenCalledWith("/admin?page=1")
  })

  it("usa el pageParam personalizado en la URL", async () => {
    const user = userEvent.setup()
    render(
      <BusinessesPagination total={15} pageSize={10} currentPage={1} pageParam="p" />
    )
    const buttons = screen.getAllByRole("button")
    await user.click(buttons[1])
    expect(mockPush).toHaveBeenCalledWith("/admin?p=2")
  })
})
