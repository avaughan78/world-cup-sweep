import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { clearProcessedFixtures } from '@/lib/db';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  await clearProcessedFixtures();
  return NextResponse.json({ ok: true, message: 'processed_fixtures cleared — next sync will re-fetch all match events' });
}
