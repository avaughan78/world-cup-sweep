import { NextRequest, NextResponse } from 'next/server';
import { createCompany, setCompanyAdminPassword, getCompanyByCode, generateClaimTokens } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rate-limit';
import { writeAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  if (!checkRateLimit(`create-company:${getIp(req)}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many sweeps created from this address — try again later' }, { status: 429 });
  }

  const { name, code, admin_password, admin_email, tombola_enabled } = await req.json() as {
    name?: string; code?: string; admin_password?: string; admin_email?: string | null; tombola_enabled?: boolean;
  };

  const trimmedName = name?.trim();
  const trimmedCode = code?.trim().toUpperCase();
  const trimmedPw = admin_password?.trim();

  if (!trimmedName) return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
  if (!trimmedCode || trimmedCode.length < 3) return NextResponse.json({ error: 'Code must be at least 3 characters' }, { status: 400 });
  if (trimmedCode.length > 10) return NextResponse.json({ error: 'Code must be 10 characters or fewer' }, { status: 400 });
  if (!trimmedPw) return NextResponse.json({ error: 'Admin password is required' }, { status: 400 });
  if (trimmedPw.length > 72) return NextResponse.json({ error: 'Password too long' }, { status: 400 });

  const existing = await getCompanyByCode(trimmedCode);
  if (existing) return NextResponse.json({ error: 'That code is already taken — try another' }, { status: 409 });

  const ip = getIp(req);
  const trimmedEmail = admin_email?.trim() || null;
  const company = await createCompany(trimmedCode, trimmedName, trimmedEmail, tombola_enabled === true);
  await setCompanyAdminPassword(company.id, trimmedPw);
  await generateClaimTokens(company.id);
  await writeAudit('sweep_created', { actor: trimmedCode, companyId: company.id, details: { name: trimmedName }, ip });

  return NextResponse.json({ ok: true, company });
}
