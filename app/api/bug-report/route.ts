import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { checkRateLimit, getIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  if (!checkRateLimit(`bug-report:${getIp(req)}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many submissions — try again later' }, { status: 429 });
  }

  const { email, description, company_code } = await req.json() as {
    email?: string;
    description?: string;
    company_code?: string;
  };

  const trimmedEmail = email?.trim();
  const trimmedDesc = description?.trim();

  if (!trimmedDesc) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 });
  }
  if (trimmedDesc.length > 1000) {
    return NextResponse.json({ error: 'Description too long' }, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: 'WC26 Sweep <hello@puntandprominence.co.uk>',
    to: 'avaughan78@gmail.com',
    ...(trimmedEmail ? { replyTo: trimmedEmail } : {}),
    subject: `Bug report / help request — WC26 Sweep${company_code ? ` (${company_code})` : ''}`,
    text: [
      trimmedEmail ? `From: ${trimmedEmail}` : 'From: (no email provided)',
      company_code ? `Sweep: ${company_code}` : '',
      '',
      trimmedDesc,
    ].filter(Boolean).join('\n'),
  });

  if (error) {
    console.error('[bug-report] Resend error:', error);
    return NextResponse.json({ error: 'Failed to send — please try again' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
