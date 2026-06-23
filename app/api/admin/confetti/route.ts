import { NextRequest, NextResponse } from 'next/server';
import { getGlobalSetting, setGlobalSetting } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const value = await getGlobalSetting('confetti_enabled');
  return NextResponse.json({ enabled: value === 'true' });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { enabled } = await req.json() as { enabled: boolean };
  await setGlobalSetting('confetti_enabled', enabled ? 'true' : 'false');
  return NextResponse.json({ ok: true, enabled });
}
