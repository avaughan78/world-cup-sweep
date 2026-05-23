import { NextRequest, NextResponse } from 'next/server';
import { createCompany, setCompanyAdminPassword, getCompanyByCode } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { name, code, admin_password } = await req.json() as {
    name?: string; code?: string; admin_password?: string;
  };

  const trimmedName = name?.trim();
  const trimmedCode = code?.trim().toUpperCase();
  const trimmedPw = admin_password?.trim();

  if (!trimmedName) return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
  if (!trimmedCode || trimmedCode.length < 3) return NextResponse.json({ error: 'Code must be at least 3 characters' }, { status: 400 });
  if (!trimmedPw) return NextResponse.json({ error: 'Admin password is required' }, { status: 400 });

  const existing = await getCompanyByCode(trimmedCode);
  if (existing) return NextResponse.json({ error: 'That code is already taken — try another' }, { status: 409 });

  const company = await createCompany(trimmedCode, trimmedName);
  await setCompanyAdminPassword(company.id, trimmedPw);

  return NextResponse.json({ ok: true, company });
}
