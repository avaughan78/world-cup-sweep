import { NextRequest, NextResponse } from 'next/server';
import { listCompanies, createCompany, deleteCompany } from '@/lib/db';

function auth(password?: string) {
  return password === process.env.ADMIN_PASSWORD;
}

export async function GET(req: NextRequest) {
  const password = req.nextUrl.searchParams.get('password');
  if (!auth(password ?? '')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const companies = await listCompanies();
  return NextResponse.json({ companies });
}

export async function POST(req: NextRequest) {
  const { password, code, name } = await req.json() as { password?: string; code?: string; name?: string };
  if (!auth(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!code?.trim() || !name?.trim()) return NextResponse.json({ error: 'code and name required' }, { status: 400 });
  try {
    const company = await createCompany(code.trim(), name.trim());
    return NextResponse.json({ ok: true, company });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { password, id } = await req.json() as { password?: string; id?: number };
  if (!auth(password)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await deleteCompany(id);
  return NextResponse.json({ ok: true });
}
