/**
 * @jest-environment jsdom
 */

jest.mock("next/navigation", () => ({ useRouter: jest.fn() }))

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BusinessActiveToggle } from "@/components/modules/admin/business-active-toggle"
import { useRouter } from "next/navigation"

const mockRefresh = jest.fn()
const routerMock = useRouter as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  routerMock.mockReturnValue({ refresh: mockRefresh })
  global.fetch = jest.fn().mockResolvedValue({ ok: true } as Response)
})

describe("BusinessActiveToggle — renderizado", () => {
  it("renderiza el switch con isActive=true (aria-checked=true)", () => {
    render(<BusinessActiveToggle id="biz-1" isActive />)
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
  })

  it("renderiza el switch con isActive=false (aria-checked=false)", () => {
    render(<BusinessActiveToggle id="biz-1" isActive={false} />)
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false")
  })
})

describe("BusinessActiveToggle — interacción", () => {
  it("hace fetch PATCH al hacer clic", async () => {
    const user = userEvent.setup()
    render(<BusinessActiveToggle id="biz-1" isActive />)
    await user.click(screen.getByRole("switch"))
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/businesses/biz-1",
      { method: "PATCH" }
    )
  })

  it("cambia optimistamente a false cuando isActive era true", async () => {
    const user = userEvent.setup()
    render(<BusinessActiveToggle id="biz-1" isActive />)
    await user.click(screen.getByRole("switch"))
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false")
  })

  it("cambia optimistamente a true cuando isActive era false", async () => {
    const user = userEvent.setup()
    render(<BusinessActiveToggle id="biz-1" isActive={false} />)
    await user.click(screen.getByRole("switch"))
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
  })

  it("revierte el estado si la respuesta no es ok", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false } as Response)
    const user = userEvent.setup()
    render(<BusinessActiveToggle id="biz-1" isActive />)
    await user.click(screen.getByRole("switch"))
    await waitFor(() => {
      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
    })
  })

  it("llama a router.refresh() en éxito", async () => {
    const user = userEvent.setup()
    render(<BusinessActiveToggle id="biz-1" isActive />)
    await user.click(screen.getByRole("switch"))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
  })
})
