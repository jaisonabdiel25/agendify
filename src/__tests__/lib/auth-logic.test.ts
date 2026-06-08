import { isPublicPath, getAuthorizedResponse } from "@/lib/auth-logic"

const BASE_URL = new URL("http://localhost:3000")

describe("isPublicPath", () => {
  it.each(["/", "/login", "/register"])("considera '%s' ruta pública exacta", (path) => {
    expect(isPublicPath(path)).toBe(true)
  })

  it.each([
    "/reserve/abc123",
    "/reserve/",
    "/api/public/businesses",
    "/api/public/services",
    "/api/public/availability",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
  ])("considera '%s' pública por prefijo", (path) => {
    expect(isPublicPath(path)).toBe(true)
  })

  it.each(["/dashboard", "/bookings", "/services", "/admin", "/chairs", "/schedule"])(
    "considera '%s' ruta protegida",
    (path) => {
      expect(isPublicPath(path)).toBe(false)
    }
  )

  it("no confunde /api/public con /api/privado", () => {
    expect(isPublicPath("/api/bookings")).toBe(false)
  })
})

describe("getAuthorizedResponse", () => {
  describe("usuario autenticado accediendo a /login", () => {
    it("redirige OWNER a /dashboard", () => {
      const result = getAuthorizedResponse({
        isAuthenticated: true,
        role: "OWNER",
        pathname: "/login",
        baseUrl: BASE_URL,
      }) as Response
      expect(result instanceof Response).toBe(true)
      expect(result.headers.get("location")).toContain("/dashboard")
    })

    it("redirige STAFF a /dashboard", () => {
      const result = getAuthorizedResponse({
        isAuthenticated: true,
        role: "STAFF",
        pathname: "/login",
        baseUrl: BASE_URL,
      }) as Response
      expect(result.headers.get("location")).toContain("/dashboard")
    })

    it("redirige ADMIN a /admin", () => {
      const result = getAuthorizedResponse({
        isAuthenticated: true,
        role: "ADMIN",
        pathname: "/login",
        baseUrl: BASE_URL,
      }) as Response
      expect(result.headers.get("location")).toContain("/admin")
    })
  })

  describe("rutas /admin", () => {
    it("redirige a /login si usuario no autenticado", () => {
      const result = getAuthorizedResponse({
        isAuthenticated: false,
        role: undefined,
        pathname: "/admin",
        baseUrl: BASE_URL,
      }) as Response
      expect(result.headers.get("location")).toContain("/login")
    })

    it("redirige a /login si el usuario no es ADMIN", () => {
      const result = getAuthorizedResponse({
        isAuthenticated: true,
        role: "OWNER",
        pathname: "/admin/businesses",
        baseUrl: BASE_URL,
      }) as Response
      expect(result.headers.get("location")).toContain("/login")
    })

    it("permite acceso a usuario ADMIN", () => {
      const result = getAuthorizedResponse({
        isAuthenticated: true,
        role: "ADMIN",
        pathname: "/admin/businesses",
        baseUrl: BASE_URL,
      })
      expect(result).toBe(true)
    })

    it("protege rutas anidadas /admin/*", () => {
      const result = getAuthorizedResponse({
        isAuthenticated: false,
        role: undefined,
        pathname: "/admin/invitations",
        baseUrl: BASE_URL,
      }) as Response
      expect(result.headers.get("location")).toContain("/login")
    })
  })

  describe("rutas públicas", () => {
    it("permite / sin autenticación", () => {
      expect(
        getAuthorizedResponse({ isAuthenticated: false, role: undefined, pathname: "/", baseUrl: BASE_URL })
      ).toBe(true)
    })

    it("permite /reserve/* sin autenticación", () => {
      expect(
        getAuthorizedResponse({ isAuthenticated: false, role: undefined, pathname: "/reserve/biz123", baseUrl: BASE_URL })
      ).toBe(true)
    })

    it("permite /api/public/* sin autenticación", () => {
      expect(
        getAuthorizedResponse({ isAuthenticated: false, role: undefined, pathname: "/api/public/services", baseUrl: BASE_URL })
      ).toBe(true)
    })
  })

  describe("rutas protegidas privadas", () => {
    it("retorna true si el usuario está autenticado", () => {
      expect(
        getAuthorizedResponse({ isAuthenticated: true, role: "OWNER", pathname: "/dashboard", baseUrl: BASE_URL })
      ).toBe(true)
    })

    it("retorna false si el usuario no está autenticado", () => {
      expect(
        getAuthorizedResponse({ isAuthenticated: false, role: undefined, pathname: "/dashboard", baseUrl: BASE_URL })
      ).toBe(false)
    })

    it("retorna false para /bookings sin autenticación", () => {
      expect(
        getAuthorizedResponse({ isAuthenticated: false, role: undefined, pathname: "/bookings", baseUrl: BASE_URL })
      ).toBe(false)
    })
  })
})
