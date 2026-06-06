import { NextRequest, NextResponse } from 'next/server';
import { validatePasswordReset, consumePasswordReset, setCompanyAdminPassword } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`reset-confirm:${getIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts' }, { status: 429 });
  }

  const { token, password } = await req.json() as { token?: string; password?: string };
  if (!token?.trim() || !password?.trim()) {
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 });
  }
  if (password.trim().length > 72) {
    return NextResponse.json({ ok: false, error: 'Password too long' }, { status: 400 });
  }

  const reset = await validatePasswordReset(token.trim());
  if (!reset) {
    return NextResponse.json({ ok: false, error: 'This link has expired or already been used' }, { status: 400 });
  }

  await consumePasswordReset(token.trim());
  await setCompanyAdminPassword(reset.companyId, password.trim());

  return NextResponse.json({ ok: true, code: reset.code });
}
