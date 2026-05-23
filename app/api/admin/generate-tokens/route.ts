import { NextRequest, NextResponse } from 'next/server';
import { generateClaimTokens, logSync } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { password, company_id } = await req.json() as { password?: string; company_id?: number };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 });
  try {
    const count = await generateClaimTokens(company_id);
    await logSync('tokens', 'success', `generated codes for ${count} teams`);
    return NextResponse.json({ ok: true, message: `Codes ready for ${count} teams. You can now print tickets.` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
