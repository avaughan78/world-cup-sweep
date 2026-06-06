import { NextRequest, NextResponse } from 'next/server';
import { updateCompany, setCompanyAdminPassword, setCompanyAdminEmail } from '@/lib/db';
import { requireManage } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const auth = await requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const { name, new_password, admin_email } = await req.json() as { name?: string; new_password?: string; admin_email?: string | null };

  if (new_password !== undefined) {
    const trimmed = new_password.trim();
    if (!trimmed) return NextResponse.json({ error: 'Password cannot be empty' }, { status: 400 });
    if (trimmed.length > 72) return NextResponse.json({ error: 'Password too long' }, { status: 400 });
    await setCompanyAdminPassword(auth.companyId, trimmed);
    return NextResponse.json({ ok: true });
  }

  if (admin_email !== undefined) {
    await setCompanyAdminEmail(auth.companyId, admin_email?.trim() || null);
    return NextResponse.json({ ok: true });
  }

  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const company = await updateCompany(auth.companyId, { name: name.trim() });
  return NextResponse.json({ ok: true, company });
}
