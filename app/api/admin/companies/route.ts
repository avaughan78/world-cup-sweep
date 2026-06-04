import { NextRequest, NextResponse } from 'next/server';
import { listCompanies, createCompany, deleteCompany, setCompanyTicketPrice, setCompanyAdminPassword, updateCompany } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const companies = await listCompanies();
  return NextResponse.json({ companies });
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { code, name } = await req.json() as { code?: string; name?: string };
  if (!code?.trim() || !name?.trim()) return NextResponse.json({ error: 'code and name required' }, { status: 400 });
  try {
    const company = await createCompany(code.trim(), name.trim());
    await writeAudit('company_created', { actor: 'admin', companyId: company.id, details: { code: company.code, name: company.name }, ip: getIp(req) });
    return NextResponse.json({ ok: true, company });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const duplicate = msg.toLowerCase().includes('unique') || msg.toLowerCase().includes('duplicate');
    return NextResponse.json(
      { ok: false, message: duplicate ? 'That code is already taken — try another' : msg },
      { status: duplicate ? 409 : 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { id, ticket_price, admin_password, name, code } = await req.json() as {
    id?: number; ticket_price?: number | null; admin_password?: string; name?: string; code?: string;
  };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  if (ticket_price !== undefined) {
    const price = ticket_price != null && ticket_price > 0 ? ticket_price : null;
    await setCompanyTicketPrice(id, price);
  }
  if (admin_password !== undefined) {
    await setCompanyAdminPassword(id, admin_password.trim() || null);
  }
  if (name?.trim() || code?.trim()) {
    const updated = await updateCompany(id, { name: name?.trim(), code: code?.trim() });
    await writeAudit('company_updated', { actor: 'admin', companyId: id, details: { name: name?.trim(), code: code?.trim() }, ip: getIp(req) });
    return NextResponse.json({ ok: true, company: updated });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const id = Number(req.nextUrl.searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await deleteCompany(id);
  await writeAudit('company_deleted', { actor: 'admin', companyId: id, ip: getIp(req) });
  return NextResponse.json({ ok: true });
}
