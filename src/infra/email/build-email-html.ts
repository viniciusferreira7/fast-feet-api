export function buildEmailHtml(title: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
                <tr>
                  <td style="background-color:#1a1a2e;padding:24px 32px;">
                    <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:1px;">Fast Feet</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px;">
                    <h2 style="margin:0 0 16px;color:#1a1a2e;font-size:18px;">${title}</h2>
                    <p style="margin:0;color:#444444;font-size:15px;line-height:1.6;">${content}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 32px;border-top:1px solid #eeeeee;">
                    <p style="margin:0;color:#aaaaaa;font-size:12px;">You received this email because an action was performed on your Fast Feet account.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
