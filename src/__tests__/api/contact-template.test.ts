import { contactEmailHtml } from "@/app/api/contact/template"

const data = {
  email: "usuario@ejemplo.com",
  phone: "61234567",
  message: "Mensaje de prueba",
}

describe("contactEmailHtml", () => {
  it("incluye el correo en el HTML", () => {
    expect(contactEmailHtml(data)).toContain(data.email)
  })

  it("incluye el teléfono en el HTML", () => {
    expect(contactEmailHtml(data)).toContain(data.phone)
  })

  it("incluye el mensaje en el HTML", () => {
    expect(contactEmailHtml(data)).toContain(data.message)
  })

  it("incluye el año actual en el footer", () => {
    expect(contactEmailHtml(data)).toContain(String(new Date().getFullYear()))
  })

  it("retorna un string con estructura HTML válida", () => {
    const html = contactEmailHtml(data)
    expect(html).toContain("<!DOCTYPE html>")
    expect(html).toContain("</html>")
  })
})
