import { NextRequest, NextResponse } from 'next/server';
import { setPrizeOverride } from '@/lib/db';
import { requireManage } from '@/lib/auth';

function safeUrl(val: string | undefined): string | null {
  if (!val?.trim()) return null;
  try {
    const u = new URL(val.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const auth = await requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const { team_name, value_label, notes } = await req.json() as {
    team_name?: string; value_label?: string; notes?: string;
  };
  await setPrizeOverride(auth.companyId, {
    category: 'most_own_goals',
    team_name: team_name?.trim() || null,
    value_label: value_label?.trim() || null,
    notes: safeUrl(notes),
  });
  return NextResponse.json({ ok: true });
}
