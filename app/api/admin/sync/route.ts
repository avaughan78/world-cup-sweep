import { NextRequest, NextResponse } from 'next/server';
import { runSync } from '@/lib/run-sync';
import { requireAdmin } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const result = await runSync();
  return NextResponse.json(result);
}
