import { cn, getContrastTextColor } from "@/lib/utils"

describe("cn", () => {
  it("une clases simples", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("ignora valores falsy", () => {
    expect(cn("foo", undefined, false as unknown as string, "bar")).toBe("foo bar")
  })

  it("resuelve conflictos de Tailwind (gana la última)", () => {
    expect(cn("p-4", "p-6")).toBe("p-6")
  })

  it("soporta objeto de clases condicionales", () => {
    expect(cn({ "text-red-500": true, "text-blue-500": false })).toBe("text-red-500")
  })

  it("retorna cadena vacía sin argumentos", () => {
    expect(cn()).toBe("")
  })

  it("une variantes de padding correctamente dejando solo la última", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4")
  })

  it("combina clases condicionales con cadenas normales", () => {
    const active = true
    expect(cn("base", { active: active, inactive: !active })).toBe("base active")
  })
})

describe("getContrastTextColor", () => {
  it("retorna negro (#000000) sobre fondo blanco", () => {
    expect(getContrastTextColor("#ffffff")).toBe("#000000")
  })

  it("retorna blanco (#ffffff) sobre fondo negro", () => {
    expect(getContrastTextColor("#000000")).toBe("#ffffff")
  })

  it("retorna negro sobre amarillo claro", () => {
    expect(getContrastTextColor("#ffff00")).toBe("#000000")
  })

  it("retorna blanco sobre azul oscuro (#1e3a8a)", () => {
    expect(getContrastTextColor("#1e3a8a")).toBe("#ffffff")
  })

  it("retorna blanco sobre rojo oscuro", () => {
    expect(getContrastTextColor("#7f1d1d")).toBe("#ffffff")
  })

  it("retorna negro sobre verde claro", () => {
    expect(getContrastTextColor("#86efac")).toBe("#000000")
  })

  it("retorna negro sobre gris medio (#808080) ya que luminancia > 0.5", () => {
    // 0.299*128 + 0.587*128 + 0.114*128 = 128 → luminance ≈ 0.502
    expect(getContrastTextColor("#808080")).toBe("#000000")
  })

  it("retorna blanco sobre púrpura oscuro", () => {
    expect(getContrastTextColor("#4c1d95")).toBe("#ffffff")
  })
})
