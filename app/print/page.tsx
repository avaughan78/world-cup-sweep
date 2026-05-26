import { redirect } from 'next/navigation';
import { getParticipantsWithTokens, getCompanyByCode } from '@/lib/db';
import { getFlag } from '@/lib/flags';
import { GROUPS_2026 } from '@/lib/groups';
import PrintTickets from '@/components/PrintTickets';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function PrintPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params.code?.trim().toUpperCase();

  if (!code) redirect('/admin');

  const company = await getCompanyByCode(code);
  if (!company) redirect('/admin');

  const participants = await getParticipantsWithTokens(company.id);
  const tokenMap = new Map(participants.map(p => [p.team_name, p.claim_token]));

  const teams = Object.values(GROUPS_2026).flat();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:3000');

  const tickets = teams.map(team => ({
    team,
    flag: getFlag(team),
    token: tokenMap.get(team) ?? null,
    claimUrl: tokenMap.get(team) ? `${baseUrl}/claim/${tokenMap.get(team)}` : null,
  }));

  const hasTokens = tickets.some(t => t.token);

  return (
    <div>
      {/* Screen-only controls */}
      <div
        className="flex items-center justify-between px-8 py-4 print:hidden"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
            World Cup 2026 · {company.name} · Draw Tickets
          </h1>
          {!hasTokens && (
            <p className="text-sm mt-0.5" style={{ color: '#ef4444' }}>
              No QR codes generated yet — go to your <a href={`/manage?code=${company.code}`} style={{ color: '#ef4444', textDecoration: 'underline' }}>organiser manage page</a> and click Generate QR Codes.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <a href="/admin" className="font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>← Admin</a>
          {hasTokens && <PrintButton />}
        </div>
      </div>

      <PrintTickets tickets={tickets} />
    </div>
  );
}
