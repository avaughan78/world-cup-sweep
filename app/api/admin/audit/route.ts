import { NextRequest, NextResponse } from 'next/server';
import { listAuditLogs } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  const entries = await listAuditLogs(300);
  return NextResponse.json({ entries });
}
