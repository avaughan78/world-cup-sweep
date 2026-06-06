import { NextResponse } from 'next/server';
import { MANAGE_COOKIE } from '@/lib/sessions';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', `${MANAGE_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
  return res;
}
