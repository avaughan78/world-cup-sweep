import { NextRequest, NextResponse } from 'next/server';
import { setCompanyTicketPrice } from '@/lib/db';
import { requireManage } from '@/lib/auth';
import { TOURNAMENT_START } from '@/lib/groups';

export async function PATCH(req: NextRequest) {
  if (Date.now() >= TOURNAMENT_START.getTime()) {
    return NextResponse.json({ error: 'Ticket price is locked after tournament start' }, { status: 403 });
  }
  const auth = await requireManage(req);
  if (auth instanceof NextResponse) return auth;
  const { ticket_price } = await req.json() as { ticket_price?: number | null };
  const price = ticket_price != null && ticket_price > 0 ? ticket_price : null;
  await setCompanyTicketPrice(auth.companyId, price);
  return NextResponse.json({ ok: true });
}
