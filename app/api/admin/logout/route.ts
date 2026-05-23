import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const home = new URL('/', req.url);
  const res = NextResponse.redirect(home);
  res.cookies.set('admin_pw', '', { maxAge: 0, path: '/' });
  return res;
}
