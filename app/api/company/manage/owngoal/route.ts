import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin, setPrizeOverride } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { code, password, team_name, value_label, notes } = await req.json() as {
    code?: string; password?: string; team_name?: string; value_label?: string; notes?: string;
  };
  const auth = await authenticateCompanyAdmin(code ?? '', password ?? '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await setPrizeOverride(auth.company.id, {
    category: 'most_own_goals',
    team_name: team_name?.trim() || null,
    value_label: value_label?.trim() || null,
    notes: notes?.trim() || null,
  });
  return NextResponse.json({ ok: true });
}
