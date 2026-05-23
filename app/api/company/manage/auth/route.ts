import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { code, password } = await req.json() as { code?: string; password?: string };
  if (!code || !password) return NextResponse.json({ ok: false, error: 'Missing credentials' }, { status: 400 });

  const result = await authenticateCompanyAdmin(code, password);
  if (!result.ok) {
    const error = result.reason === 'not_configured'
      ? 'Admin access not set up — ask your organiser to configure it'
      : 'Incorrect password';
    return NextResponse.json({ ok: false, error }, { status: 401 });
  }
  return NextResponse.json({ ok: true, company: result.company });
}
