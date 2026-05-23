import { NextRequest, NextResponse } from 'next/server';
import { getCompanyByCode } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { code } = await req.json() as { code?: string };
  if (!code) return NextResponse.json({ ok: false });
  const company = await getCompanyByCode(code);
  if (!company) return NextResponse.json({ ok: false, error: 'Company code not found' });
  return NextResponse.json({ ok: true, company: { id: company.id, code: company.code, name: company.name } });
}
