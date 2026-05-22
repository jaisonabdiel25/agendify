import { credentialsSchema } from "@/lib/auth-schema"

describe("credentialsSchema", () => {
  describe("email", () => {
    it("acepta un email válido", () => {
      const result = credentialsSchema.safeParse({ email: "usuario@ejemplo.com", password: "123" })
      expect(result.success).toBe(true)
    })

    it("rechaza un email sin @", () => {
      const result = credentialsSchema.safeParse({ email: "usuarioejemplo.com", password: "123" })
      expect(result.success).toBe(false)
    })

    it("rechaza un email vacío", () => {
      const result = credentialsSchema.safeParse({ email: "", password: "123" })
      expect(result.success).toBe(false)
    })

    it("rechaza un email sin dominio", () => {
      const result = credentialsSchema.safeParse({ email: "usuario@", password: "123" })
      expect(result.success).toBe(false)
    })

    it("rechaza email faltante", () => {
      const result = credentialsSchema.safeParse({ password: "123" })
      expect(result.success).toBe(false)
    })
  })

  describe("password", () => {
    it("acepta contraseña de 1 carácter (min)", () => {
      const result = credentialsSchema.safeParse({ email: "a@b.com", password: "x" })
      expect(result.success).toBe(true)
    })

    it("rechaza contraseña vacía", () => {
      const result = credentialsSchema.safeParse({ email: "a@b.com", password: "" })
      expect(result.success).toBe(false)
    })

    it("rechaza password faltante", () => {
      const result = credentialsSchema.safeParse({ email: "a@b.com" })
      expect(result.success).toBe(false)
    })

    it("acepta contraseñas largas", () => {
      const result = credentialsSchema.safeParse({ email: "a@b.com", password: "x".repeat(100) })
      expect(result.success).toBe(true)
    })
  })

  it("retorna los datos parseados correctamente", () => {
    const result = credentialsSchema.safeParse({ email: "TEST@EJEMPLO.COM", password: "miContraseña" })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe("TEST@EJEMPLO.COM")
      expect(result.data.password).toBe("miContraseña")
    }
  })
})
