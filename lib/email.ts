import Mailjet from 'node-mailjet';

const mj = new Mailjet({
  apiKey: process.env.MAILJET_API_KEY!,
  apiSecret: process.env.MAILJET_SECRET!,
});

const FROM_EMAIL = process.env.EMAIL_FROM_ADDRESS ?? 'noreply@wcsweep.dev';
const FROM_NAME  = process.env.EMAIL_FROM_NAME    ?? 'WC26 Sweep';

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
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,sans-serif;background:#0d0c0a;margin:0;padding:32px 16px;">
  <div style="max-width:500px;margin:0 auto;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#4D10C8 0%,#8B1A1A 60%,#D40100 100%);border-radius:16px 16px 0 0;padding:32px 36px 28px;">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.55);">
        FIFA World Cup · USA · Canada · Mexico · 2026
      </p>
      <p style="margin:0;font-size:32px;font-weight:900;color:#fff;line-height:1;letter-spacing:-0.01em;">WC26 Sweep</p>
      <p style="margin:6px 0 0;font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);">Organiser Admin · ${companyCode}</p>
    </div>

    <!-- Body -->
    <div style="background:#1a1816;border-radius:0 0 16px 16px;padding:32px 36px 36px;">
      <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#f5f4ee;letter-spacing:-0.01em;">Reset your password</h2>
      <p style="margin:0 0 6px;font-size:14px;color:#8a8678;">
        Sweep: <strong style="color:#f5f4ee;">${companyName}</strong>
      </p>
      <p style="margin:0 0 28px;font-size:14px;color:#8a8678;line-height:1.6;">
        Click the button below to set a new admin password. This link expires in <strong style="color:#f5f4ee;">1 hour</strong>.
      </p>

      <a href="${resetUrl}"
        style="display:inline-block;background:#4D10C8;color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;letter-spacing:0.01em;">
        Reset password →
      </a>

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #2a2820;">
        <p style="margin:0 0 6px;font-size:12px;color:#4a4840;">
          If you didn't request this, you can safely ignore this email — your password won't change.
        </p>
        <p style="margin:0;font-size:11px;color:#333;word-break:break-all;">
          ${resetUrl}
        </p>
      </div>
    </div>

    <!-- Footer -->
    <p style="margin:16px 0 0;text-align:center;font-size:11px;color:#3a3830;">
      48 teams · 104 matches · 11 Jun – 19 Jul 2026
    </p>
  </div>
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
