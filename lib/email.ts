import Mailjet from 'node-mailjet';

const mj = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY!,
  apiSecret: process.env.MAILJET_SECRET!,
});

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS ?? 'noreply@wcsweep.dev';
const FROM_NAME  = process.env.EMAIL_FROM_NAME    ?? 'WC26 Sweep';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL
  ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'https://wcsweep.dev');

export async function sendPasswordResetEmail({
  to,
  companyName,
  companyCode,
  resetUrl,
}: {
  to: string;
  companyName: string;
  companyCode: string;
  resetUrl: string;
}) {
  const result = await mj.post('send', { version: 'v3.1' }).request({
    Messages: [
      {
        From: { Email: FROM_EMAIL, Name: FROM_NAME },
        To:   [{ Email: to }],
        Subject: `Reset your WC26 Sweep password — ${companyCode}`,
        HTMLPart: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f0ede8;padding:32px 16px;">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" role="presentation" style="max-width:500px;width:100%;">

        <!-- ── HEADER ── -->
        <tr><td style="border-radius:16px 16px 0 0;overflow:hidden;padding:0;background:linear-gradient(135deg,#4D10C8 0%,#8B1A1A 60%,#D40100 100%);">
          <!-- BG image layer -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
            style="background-image:url('${BASE_URL}/wc2026-header-bg.png');background-size:cover;background-position:center;border-radius:16px 16px 0 0;">
            <tr>
              <td style="padding:32px 36px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td style="vertical-align:top;">
                      <p style="margin:0 0 4px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.6);">
                        FIFA World Cup · USA · Canada · Mexico · 2026
                      </p>
                      <p style="margin:0;font-size:36px;font-weight:900;color:#fff;line-height:1;letter-spacing:-0.02em;">
                        WC26 Sweep
                      </p>
                      <p style="margin:6px 0 0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.55);">
                        Organiser Admin &middot; ${companyCode}
                      </p>
                    </td>
                    <td style="vertical-align:bottom;text-align:right;width:80px;padding-left:16px;">
                      <img src="${BASE_URL}/world-cup-trophy.webp" alt="World Cup trophy"
                        width="60" style="display:block;margin-left:auto;opacity:0.9;filter:brightness(1.1);" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- ── BODY ── -->
        <tr><td style="background:#ffffff;border-radius:0 0 16px 16px;padding:36px 36px 40px;">

          <!-- Eyebrow -->
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#4D10C8;">
            Password reset
          </p>

          <h1 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#1a1a17;letter-spacing:-0.01em;line-height:1.2;">
            Set a new password for<br><span style="color:#4D10C8;">${companyName}</span>
          </h1>

          <p style="margin:0 0 28px;font-size:15px;color:#6b6760;line-height:1.6;">
            Click the button below to choose a new admin password.
            This link is valid for <strong style="color:#1a1a17;">1 hour</strong> and can only be used once.
          </p>

          <!-- CTA button -->
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="border-radius:12px;background:#4D10C8;">
                <a href="${resetUrl}"
                  style="display:inline-block;padding:16px 36px;font-size:16px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.02em;border-radius:12px;">
                  Reset password &rarr;
                </a>
              </td>
            </tr>
          </table>

          <!-- Divider -->
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:36px;">
            <tr><td style="border-top:1px solid #e5e2d8;padding-top:24px;">
              <p style="margin:0 0 10px;font-size:12px;color:#8a8678;line-height:1.5;">
                If you didn&rsquo;t request this reset, you can safely ignore this email &mdash; your password won&rsquo;t change.
              </p>
              <p style="margin:0;font-size:11px;color:#b0ab9f;word-break:break-all;">
                ${resetUrl}
              </p>
            </td></tr>
          </table>

        </td></tr>

        <!-- ── FOOTER ── -->
        <tr><td style="padding:20px 36px 8px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;color:#8a8678;letter-spacing:0.04em;">
            48 teams &middot; 104 matches &middot; 11 Jun &ndash; 19 Jul 2026
          </p>
          <p style="margin:0;font-size:10px;color:#a0998f;">
            <a href="${BASE_URL}" style="color:#4D10C8;text-decoration:none;">${BASE_URL.replace(/^https?:\/\//, '')}</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
      },
    ],
  });

  const status = (result.response as { status: number }).status;
  if (status < 200 || status >= 300) {
    throw new Error(`Mailjet send failed with status ${status}`);
  }
}
