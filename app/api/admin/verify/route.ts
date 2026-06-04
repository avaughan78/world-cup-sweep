import { NextRequest, NextResponse } from 'next/server';
import { createAdminSession, ADMIN_COOKIE, COOKIE_OPTS } from '@/lib/sessions';
import { checkRateLimit, getIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`admin-login:${getIp(req)}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts — try again later' }, { status: 429 });
  }

  const { password } = await req.json() as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
  }

  const token = createAdminSession();
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${token}; ${COOKIE_OPTS}`);
  return res;
}
