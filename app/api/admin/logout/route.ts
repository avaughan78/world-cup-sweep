import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL ?? 'https://wcsweep.dev'));
  res.cookies.set('admin_pw', '', { maxAge: 0, path: '/' });
  return res;
}
