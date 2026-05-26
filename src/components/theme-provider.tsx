"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
})

export function useTheme() {
  return useContext(ThemeContext)
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "agendify-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme
    const stored = localStorage.getItem(storageKey) as Theme | null
    if (stored === "light" || stored === "dark" || stored === "system") return stored
    return defaultTheme
  })
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")

    function apply(t: Theme) {
      const resolved: "light" | "dark" =
        t === "system" ? (media.matches ? "dark" : "light") : t
      setResolvedTheme(resolved)
      root.classList.toggle("dark", resolved === "dark")
      document.cookie = `${storageKey}=${resolved};path=/;max-age=31536000;SameSite=Lax`
    }

    apply(theme)

    if (theme === "system") {
      const listener = () => apply("system")
      media.addEventListener("change", listener)
      return () => media.removeEventListener("change", listener)
    }
  }, [theme, storageKey])

  function setTheme(newTheme: Theme) {
    localStorage.setItem(storageKey, newTheme)
    setThemeState(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
