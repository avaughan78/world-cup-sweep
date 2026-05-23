import { NextRequest, NextResponse } from 'next/server';
import { authenticateCompanyAdmin, setCompanyTicketPrice } from '@/lib/db';

export async function PATCH(req: NextRequest) {
  const { code, password, ticket_price } = await req.json() as {
    code?: string; password?: string; ticket_price?: number | null;
  };
  const auth = await authenticateCompanyAdmin(code ?? '', password ?? '');
  if (!auth.ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const price = ticket_price != null && ticket_price > 0 ? ticket_price : null;
  await setCompanyTicketPrice(auth.company.id, price);
  return NextResponse.json({ ok: true });
}
