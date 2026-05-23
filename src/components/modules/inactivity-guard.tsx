"use client"

import { useInactivityLogout } from "@/hooks/use-inactivity-logout"

export function InactivityGuard() {
  useInactivityLogout()
  return null
}
