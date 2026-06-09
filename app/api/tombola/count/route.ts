import { NextRequest, NextResponse } from 'next/server';
import { getCompanyByCode, getUnclaimedCount } from '@/lib/db';

export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  const company = await getCompanyByCode(code.trim().toUpperCase());
  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const unclaimed = await getUnclaimedCount(company.id);
  return NextResponse.json({ unclaimed });
}
