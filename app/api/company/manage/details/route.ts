import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin, updateCompany } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const { code, password, name } = await req.json() as {
    code?: string; password?: string; name?: string;
  };
  const auth = await authenticateCompanyAdmin(code ?? '', password ?? '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!name?.trim()) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const company = await updateCompany(auth.company.id, { name: name.trim() });
  return NextResponse.json({ ok: true, company });
}
