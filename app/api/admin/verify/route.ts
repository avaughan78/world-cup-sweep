import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminSession, ADMIN_COOKIE, COOKIE_OPTS } from '@/lib/sessions';
import { checkRateLimit, getIp } from '@/lib/rate-limit';
import { writeAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRateLimit(`admin-login:${ip}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts — try again later' }, { status: 429 });
  }

  const { password } = await req.json() as { password?: string };
  const adminPass = process.env.ADMIN_PASSWORD ?? '';
  const passOk = !!password && password.length === adminPass.length &&
    crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPass));
  if (!passOk) {
    await writeAudit('admin_login_fail', { actor: 'admin', ip });
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const token = await createAdminSession();
  await writeAudit('admin_login_ok', { actor: 'admin', ip });
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${token}; ${COOKIE_OPTS}`);
  return res;
}
