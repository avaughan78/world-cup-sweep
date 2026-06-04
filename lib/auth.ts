import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSession, validateManageSession, ADMIN_COOKIE, MANAGE_COOKIE } from './sessions';

export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!validateAdminSession(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export function requireManage(req: NextRequest): { companyId: number } | NextResponse {
  const token = req.cookies.get(MANAGE_COOKIE)?.value;
  const companyId = validateManageSession(token);
  if (!companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return { companyId };
}
