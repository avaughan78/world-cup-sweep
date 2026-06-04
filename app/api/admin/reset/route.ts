import { NextRequest, NextResponse } from 'next/server';
import { resetCompany, resetTournamentStats, logSync } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { writeAudit } from '@/lib/audit';
import { getIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const { company_id } = await req.json() as { company_id?: number };
  try {
    const ip = getIp(req);
    if (company_id) {
      await resetCompany(company_id);
      await logSync('reset', 'success', `company ${company_id} draw cleared`);
      await writeAudit('company_reset', { actor: 'admin', companyId: company_id, ip });
      return NextResponse.json({ ok: true, message: 'Company draw cleared. All participant names and tokens removed.' });
    } else {
      await resetTournamentStats();
      await logSync('reset', 'success', 'all tournament stats cleared');
      await writeAudit('tournament_reset', { actor: 'admin', ip });
      return NextResponse.json({ ok: true, message: 'Tournament stats cleared. Ready for the new season.' });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
