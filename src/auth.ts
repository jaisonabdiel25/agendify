import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"
import { z } from "zod"

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            businessId: true,
            role: true,
          },
        })

        if (!user) return null

        const valid = await bcrypt.compare(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          businessId: user.businessId,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.businessId = user.businessId
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.businessId = token.businessId as string
      session.user.role = token.role as UserRole
      return session
    },
    authorized({ auth: session, request }) {
      const isAuthenticated = !!session?.user
      const pathname = request.nextUrl.pathname

      const publicPaths = ["/", "/login", "/register"]
      const publicPrefixes = ["/reserve", "/api/public"]
      const isPublicPath =
        publicPaths.includes(pathname) ||
        publicPrefixes.some((p) => pathname.startsWith(p))

      if (isAuthenticated && pathname === "/login") {
        const dest = session.user.role === "ADMIN" ? "/admin" : "/dashboard"
        return Response.redirect(new URL(dest, request.nextUrl))
      }

      if (pathname.startsWith("/admin")) {
        if (!isAuthenticated) return Response.redirect(new URL("/login", request.nextUrl))
        if (session.user.role !== "ADMIN") return Response.redirect(new URL("/login", request.nextUrl))
        return true
      }

      if (isPublicPath) return true

      return isAuthenticated
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
})
