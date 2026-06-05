import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin } from '@/lib/db';
import { createManageSession, MANAGE_COOKIE, COOKIE_OPTS } from '@/lib/sessions';
import { checkRateLimit, getIp } from '@/lib/rate-limit';
import { writeAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRateLimit(`manage-login:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Too many attempts — try again later' }, { status: 429 });
  }

  const { code, password } = await req.json() as { code?: string; password?: string };
  if (!code || !password) return NextResponse.json({ ok: false, error: 'Missing credentials' }, { status: 400 });

  const result = await authenticateCompanyAdmin(code, password);
  if (!result.ok) {
    const error = result.reason === 'not_configured'
      ? 'Admin access not set up — ask your organiser to configure it'
      : 'Incorrect password';
    await writeAudit('company_login_fail', { actor: code.toUpperCase(), details: { reason: result.reason }, ip });
    return NextResponse.json({ ok: false, error }, { status: 401 });
  }

  const token = await createManageSession(result.company.id);
  await writeAudit('company_login_ok', { actor: result.company.code, companyId: result.company.id, ip });
  const res = NextResponse.json({ ok: true, company: result.company });
  res.headers.set('Set-Cookie', `${MANAGE_COOKIE}=${token}; ${COOKIE_OPTS}`);
  return res;
}
