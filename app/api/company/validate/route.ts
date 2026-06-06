import { NextRequest, NextResponse } from 'next/server';
import { getCompanyByCode } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!checkRateLimit(`validate:${ip}`, 30, 60_000)) {
    return NextResponse.json({ ok: false, error: 'Too many requests' }, { status: 429 });
  }

  const { code } = await req.json() as { code?: string };
  if (!code) return NextResponse.json({ ok: false });
  const company = await getCompanyByCode(code);
  if (!company) return NextResponse.json({ ok: false, error: 'Company code not found' });
  return NextResponse.json({ ok: true, company: { id: company.id, code: company.code, name: company.name } });
}
