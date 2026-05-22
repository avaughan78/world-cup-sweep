import { NextRequest, NextResponse } from 'next/server';
import { setPrizeOverride } from '@/lib/db';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    password?: string;
    team_name?: string;
    value_label?: string;
    notes?: string;
  };

  if (!body.password || body.password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await setPrizeOverride({
    category: 'longest_shot',
    team_name: body.team_name?.trim() || null,
    value_label: body.value_label?.trim() || null,
    notes: body.notes?.trim() || null,
  });

  return NextResponse.json({ ok: true });
}
