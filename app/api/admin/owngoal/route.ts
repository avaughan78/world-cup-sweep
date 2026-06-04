import { NextRequest, NextResponse } from 'next/server';
import { setPrizeOverride } from '@/lib/db';
import sql from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

function safeUrl(val: string | undefined): string | null {
  if (!val?.trim()) return null;
  try {
    const u = new URL(val.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const body = await req.json() as { team_name?: string; value_label?: string; notes?: string };
  const companies = await sql`SELECT id FROM companies`;
  for (const c of companies) {
    await setPrizeOverride(c.id as number, {
      category: 'most_own_goals',
      team_name: body.team_name?.trim() || null,
      value_label: body.value_label?.trim() || null,
      notes: safeUrl(body.notes),
    });
  }
  return NextResponse.json({ ok: true, companies: companies.length });
}
