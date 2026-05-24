/**
 * @jest-environment jsdom
 */

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}))

import { renderHook } from "@testing-library/react"
import { act } from "@testing-library/react"
import { signOut } from "next-auth/react"
import { useInactivityLogout } from "@/hooks/use-inactivity-logout"
import { INACTIVITY_TIMEOUT_MS } from "@/constant"
const signOutMock = signOut as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe("useInactivityLogout — registro de listeners", () => {
  it("registra los 6 eventos de actividad al montar", () => {
    const addSpy = jest.spyOn(window, "addEventListener")
    renderHook(() => useInactivityLogout())

    const expected = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"]
    for (const event of expected) {
      expect(addSpy).toHaveBeenCalledWith(event, expect.any(Function), { passive: true })
    }
  })

  it("elimina los 6 eventos al desmontar", () => {
    const removeSpy = jest.spyOn(window, "removeEventListener")
    const { unmount } = renderHook(() => useInactivityLogout())

    unmount()

    const expected = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"]
    for (const event of expected) {
      expect(removeSpy).toHaveBeenCalledWith(event, expect.any(Function))
    }
  })
})

describe("useInactivityLogout — temporizador", () => {
  it("llama a signOut con callbackUrl /login tras 10 minutos de inactividad", () => {
    renderHook(() => useInactivityLogout())

    act(() => {
      jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS)
    })

    expect(signOutMock).toHaveBeenCalledTimes(1)
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/login" })
  })

  it("no llama a signOut antes de que transcurran 10 minutos", () => {
    renderHook(() => useInactivityLogout())

    act(() => {
      jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 1)
    })

    expect(signOutMock).not.toHaveBeenCalled()
  })

  it("no llama a signOut después de desmontar el componente", () => {
    const { unmount } = renderHook(() => useInactivityLogout())

    unmount()

    act(() => {
      jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS)
    })

    expect(signOutMock).not.toHaveBeenCalled()
  })
})

describe("useInactivityLogout — reset por actividad", () => {
  it("reinicia el temporizador al detectar un evento de mousemove", () => {
    renderHook(() => useInactivityLogout())

    // Avanzar casi hasta el timeout
    act(() => {
      jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 1000)
    })
    expect(signOutMock).not.toHaveBeenCalled()

    // Simular actividad del usuario → reinicia el timer
    act(() => {
      window.dispatchEvent(new Event("mousemove"))
    })

    // Avanzar otro casi-timeout desde el reset (aún no debe expirar)
    act(() => {
      jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 1000)
    })
    expect(signOutMock).not.toHaveBeenCalled()

    // Completar el segundo timeout
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    expect(signOutMock).toHaveBeenCalledTimes(1)
  })

  it.each(["mousedown", "keydown", "scroll", "touchstart", "click"] as const)(
    "reinicia el temporizador ante el evento %s",
    (eventName) => {
      renderHook(() => useInactivityLogout())

      act(() => {
        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 1000)
      })

      act(() => {
        window.dispatchEvent(new Event(eventName))
      })

      act(() => {
        jest.advanceTimersByTime(INACTIVITY_TIMEOUT_MS - 1000)
      })

      expect(signOutMock).not.toHaveBeenCalled()
    }
  )
})
