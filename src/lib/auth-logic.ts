const PUBLIC_PATHS = ["/", "/login", "/register"] as const
const PUBLIC_PREFIXES = ["/reserve", "/api/public"] as const

export function isPublicPath(pathname: string): boolean {
  return (
    (PUBLIC_PATHS as readonly string[]).includes(pathname) ||
    (PUBLIC_PREFIXES as readonly string[]).some((p) => pathname.startsWith(p))
  )
}

export function getAuthorizedResponse({
  isAuthenticated,
  role,
  pathname,
  baseUrl,
}: {
  isAuthenticated: boolean
  role: string | undefined
  pathname: string
  baseUrl: URL
}): boolean | Response {
  if (isAuthenticated && pathname === "/login") {
    const dest = role === "ADMIN" ? "/admin" : "/dashboard"
    return Response.redirect(new URL(dest, baseUrl))
  }

  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) return Response.redirect(new URL("/login", baseUrl))
    if (role !== "ADMIN") return Response.redirect(new URL("/login", baseUrl))
    return true
  }

  if (isPublicPath(pathname)) return true

  return isAuthenticated
}
