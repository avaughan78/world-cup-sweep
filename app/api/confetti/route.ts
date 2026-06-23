import { NextResponse } from 'next/server';
import { getGlobalSetting } from '@/lib/db';

export async function GET() {
  const value = await getGlobalSetting('confetti_enabled');
  return NextResponse.json({ enabled: value === 'true' }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
