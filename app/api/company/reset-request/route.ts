import { NextRequest, NextResponse } from 'next/server';
import { getCompanyByCode, createPasswordReset } from '@/lib/db';
import { sendPasswordResetEmail } from '@/lib/email';
import { checkRateLimit, getIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRateLimit(`reset-request:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts — try again later' }, { status: 429 });
  }

  const { code, email } = await req.json() as { code?: string; email?: string };
  if (!code?.trim() || !email?.trim()) {
    return NextResponse.json({ ok: false, error: 'Code and email are required' }, { status: 400 });
  }

  const company = await getCompanyByCode(code.trim());

  // Always return ok=true to avoid leaking whether a code/email combo exists
  if (!company || !company.admin_email) {
    return NextResponse.json({ ok: true });
  }
  if (company.admin_email.toLowerCase() !== email.trim().toLowerCase()) {
    return NextResponse.json({ ok: true });
  }

  const token = await createPasswordReset(company.id);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:3000');
  const resetUrl = `${baseUrl}/manage/reset/${token}`;

  try {
    await sendPasswordResetEmail({
      to: company.admin_email,
      companyName: company.name,
      companyCode: company.code,
      resetUrl,
    });
  } catch (err) {
    console.error('[reset-request] email send failed:', err);
    return NextResponse.json({ ok: false, error: 'Failed to send email — please try again' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
