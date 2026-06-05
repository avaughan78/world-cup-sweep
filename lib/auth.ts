import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSession, validateManageSession, ADMIN_COOKIE, MANAGE_COOKIE } from './sessions';

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!await validateAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function requireManage(req: NextRequest): Promise<{ companyId: number } | NextResponse> {
  const token = req.cookies.get(MANAGE_COOKIE)?.value;
  const companyId = await validateManageSession(token);
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { companyId };
}
