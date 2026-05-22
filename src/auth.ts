import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"
import { credentialsSchema } from "@/lib/auth-schema"
import { getAuthorizedResponse } from "@/lib/auth-logic"

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
      return getAuthorizedResponse({
        isAuthenticated: !!session?.user,
        role: session?.user?.role,
        pathname: request.nextUrl.pathname,
        baseUrl: request.nextUrl,
      })
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
})
