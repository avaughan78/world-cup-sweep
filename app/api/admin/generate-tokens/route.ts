import { NextRequest, NextResponse } from 'next/server';
import { generateClaimTokens, logSync } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { company_id } = await req.json() as { company_id?: number };
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  try {
    const count = await generateClaimTokens(company_id);
    await logSync('tokens', 'success', `generated codes for ${count} teams`);
    await writeAudit('tokens_generated', { actor: 'admin', companyId: company_id, details: { count }, ip: getIp(req) });
    return NextResponse.json({ ok: true, message: `Codes ready for ${count} teams. You can now print tickets.` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
