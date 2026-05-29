interface ContactEmailData {
  email: string
  phone: string
  message: string
}

export function contactEmailHtml({ email, phone, message }: ContactEmailData): string {
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08)">

        <!-- Header -->
        <tr>
          <td style="background:#09090b;padding:28px 32px">
            <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">Agendify</p>
            <p style="margin:6px 0 0;font-size:13px;color:#71717a">Nuevo mensaje de contacto</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px">

            <!-- Field: Correo -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
              <tr>
                <td style="background:#f9f9fa;border:1px solid #e4e4e7;border-radius:8px;padding:14px 18px">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.08em">Correo</p>
                  <p style="margin:0;font-size:14px;color:#09090b">${email}</p>
                </td>
              </tr>
            </table>

            <!-- Field: Celular -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px">
              <tr>
                <td style="background:#f9f9fa;border:1px solid #e4e4e7;border-radius:8px;padding:14px 18px">
                  <p style="margin:0 0 2px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.08em">Celular</p>
                  <p style="margin:0;font-size:14px;color:#09090b">${phone}</p>
                </td>
              </tr>
            </table>

            <!-- Field: Mensaje -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f9f9fa;border:1px solid #e4e4e7;border-radius:8px;padding:14px 18px">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:0.08em">Mensaje</p>
                  <p style="margin:0;font-size:14px;color:#09090b;line-height:1.6;white-space:pre-wrap">${message}</p>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f4f4f5">
            <p style="margin:0;font-size:12px;color:#a1a1aa;text-align:center">© ${year} Agendify · Este correo fue generado automáticamente</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
