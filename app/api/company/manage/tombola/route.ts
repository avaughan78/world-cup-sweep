import { NextRequest, NextResponse } from 'next/server';
import { setCompanyTombolaEnabled } from '@/lib/db';
import { requireManage } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const auth = await requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const { enabled } = await req.json() as { enabled?: boolean };
  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 });
  }
  await setCompanyTombolaEnabled(auth.companyId, enabled);
  return NextResponse.json({ ok: true });
}
