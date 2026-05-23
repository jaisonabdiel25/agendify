"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface BusinessActiveToggleProps {
  id: string
  isActive: boolean
}

export function BusinessActiveToggle({ id, isActive: initialValue }: BusinessActiveToggleProps) {
  const router = useRouter()
  const [isActive, setIsActive] = useState(initialValue)
  const [isPending, startTransition] = useTransition()

  async function toggle() {
    const optimistic = !isActive
    setIsActive(optimistic)

    const res = await fetch(`/api/admin/businesses/${id}`, { method: "PATCH" })

    if (!res.ok) {
      setIsActive(!optimistic)
      return
    }

    startTransition(() => router.refresh())
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        isActive ? "bg-emerald-500" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm ring-0 transition-transform duration-200",
          isActive ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}
