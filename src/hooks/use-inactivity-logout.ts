"use client"

import { useEffect, useRef } from "react"
import { signOut } from "next-auth/react"

const TIMEOUT_MS = 10 * 60 * 1000
const EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"] as const

export function useInactivityLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        signOut({ callbackUrl: "/login" })
      }, TIMEOUT_MS)
    }

    reset()
    EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      EVENTS.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [])
}
