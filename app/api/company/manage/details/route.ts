import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin, updateCompany, setCompanyAdminPassword } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const { code, password, name, new_password } = await req.json() as {
    code?: string; password?: string; name?: string; new_password?: string;
  };
  const auth = await authenticateCompanyAdmin(code ?? '', password ?? '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (new_password !== undefined) {
    const trimmed = new_password.trim();
    if (!trimmed) return NextResponse.json({ error: 'Password cannot be empty' }, { status: 400 });
    await setCompanyAdminPassword(auth.company.id, trimmed);
    return NextResponse.json({ ok: true, new_password: trimmed });
  }

  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const company = await updateCompany(auth.company.id, { name: name.trim() });
  return NextResponse.json({ ok: true, company });
}
