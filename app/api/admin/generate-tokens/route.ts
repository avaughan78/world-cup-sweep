import { NextRequest, NextResponse } from 'next/server';
import { generateClaimTokens, logSync } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const count = await generateClaimTokens();
    await logSync('tokens', 'success', `generated tokens for ${count} teams`);
    return NextResponse.json({ ok: true, message: `Tokens ready for ${count} teams. You can now print tickets.` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
