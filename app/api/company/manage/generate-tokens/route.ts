import { NextRequest, NextResponse } from 'next/server';
import { generateClaimTokens } from '@/lib/db';
import { requireManage } from '@/lib/auth';
import { checkRateLimit, getIp } from '@/lib/rate-limit';
import { writeAudit } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const auth = requireManage(req);
  if (auth instanceof NextResponse) return auth;
  if (!checkRateLimit(`gen-tokens:${auth.companyId}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'Token generation rate limited — wait an hour before regenerating' }, { status: 429 });
  }
  const count = await generateClaimTokens(auth.companyId);
  await writeAudit('tokens_generated', { actor: 'company', companyId: auth.companyId, details: { count }, ip: getIp(req) });
  return NextResponse.json({ ok: true, message: `QR codes ready for ${count} teams. You can now print tickets.` });
}
