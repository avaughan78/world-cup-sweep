import { NextRequest, NextResponse } from 'next/server';
import { getCompanyByCode, drawTombolaTeam } from '@/lib/db';
import { checkRateLimit, getIp } from '@/lib/rate-limit';
import { writeAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  if (!checkRateLimit(`tombola:${ip}`, 10, 2 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many requests — slow down' }, { status: 429 });
  }

  const { code, name } = await req.json() as { code?: string; name?: string };
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (trimmed.length > 50) return NextResponse.json({ error: 'Name too long' }, { status: 400 });

  const company = await getCompanyByCode(code);
  if (!company) return NextResponse.json({ error: 'Sweep not found' }, { status: 404 });
  if (!company.tombola_enabled) return NextResponse.json({ error: 'Lucky dip is not enabled for this sweep' }, { status: 403 });

  const maxTeams = company.max_teams_per_person ?? 2;
  const result = await drawTombolaTeam(company.id, trimmed, maxTeams);

  if (!result.ok) {
    const message = result.reason === 'name_limit'
      ? `You have already drawn ${maxTeams} team${maxTeams === 1 ? '' : 's'} for this sweep`
      : 'No teams left to claim — the draw is complete!';
    return NextResponse.json({ error: message, reason: result.reason }, { status: 409 });
  }

  await writeAudit('tombola_draw', {
    actor: trimmed,
    companyId: company.id,
    details: { team: result.team_name, code: company.code },
    ip,
  });

  return NextResponse.json({ ok: true, team_name: result.team_name });
}
