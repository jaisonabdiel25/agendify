/**
 * @jest-environment jsdom
 */

jest.mock("@/hooks/use-inactivity-logout", () => ({
  useInactivityLogout: jest.fn(),
}))

import { render } from "@testing-library/react"
import { InactivityGuard } from "@/components/modules/inactivity-guard"
import { useInactivityLogout } from "@/hooks/use-inactivity-logout"

describe("InactivityGuard", () => {
  it("llama al hook useInactivityLogout al montarse", () => {
    render(<InactivityGuard />)
    expect(useInactivityLogout).toHaveBeenCalled()
  })

  it("no renderiza ningún elemento visible en el DOM", () => {
    const { container } = render(<InactivityGuard />)
    expect(container.firstChild).toBeNull()
  })
})
