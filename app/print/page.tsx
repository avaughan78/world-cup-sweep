import { redirect } from 'next/navigation';
import { getParticipantsWithTokens, getCompanyByCode } from '@/lib/db';
import { getFlag, getFlagUrl } from '@/lib/flags';
import { GROUPS_2026 } from '@/lib/groups';
import PrintTickets from '@/components/PrintTickets';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const GROUP_KEYS = Object.keys(GROUPS_2026);
const LEFT_GROUPS  = GROUP_KEYS.slice(0, 6);
const RIGHT_GROUPS = GROUP_KEYS.slice(6);

function GroupBlock({ letter, teams }: { letter: string; teams: string[] }) {
  return (
    <div style={{ marginBottom: '4mm' }}>
      <div style={{
        background: '#4D10C8', padding: '2mm 3.5mm',
        borderRadius: '1.5mm 1.5mm 0 0',
      }}>
        <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '7.5pt', fontWeight: 900, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Group {letter}
        </span>
      </div>
      <div style={{ border: '1px solid #ddd9ce', borderTop: 'none', borderRadius: '0 0 1.5mm 1.5mm', overflow: 'hidden' }}>
        {teams.map((team, i) => {
          const flagUrl = getFlagUrl(team);
          return (
            <div key={team} style={{
              display: 'flex', alignItems: 'flex-end', gap: '2.5mm',
              padding: '2mm 3.5mm 1.5mm',
              background: i % 2 === 0 ? '#fff' : '#faf9f5',
              borderBottom: i < teams.length - 1 ? '1px solid #ede9de' : 'none',
              minHeight: '9mm',
            }}>
              <div style={{ width: '22px', height: '15px', flexShrink: 0, display: 'flex', alignItems: 'center', marginBottom: '1mm' }}>
                {flagUrl ? (
                  <img src={flagUrl} alt={team} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '1px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', display: 'block' }} />
                ) : (
                  <span style={{ fontSize: '9pt' }}>🏳️</span>
                )}
              </div>
              <span style={{ fontFamily: 'system-ui, sans-serif', fontSize: '7.5pt', fontWeight: 700, color: '#2a2820', lineHeight: 1.25, flexShrink: 0, width: '27mm' }}>
                {team}
              </span>
              <div style={{ flex: 1, borderBottom: '1.5px dashed #bbb', marginBottom: '1.5mm' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
            World Cup 2026 · {company.name} · Tickets &amp; Draw Register
          </h1>
          {!hasTokens && (
            <p className="text-sm mt-0.5" style={{ color: '#ef4444' }}>
              No QR codes generated yet — go to your <a href={`/manage?code=${company.code}`} style={{ color: '#ef4444', textDecoration: 'underline' }}>organiser manage page</a> and click Generate QR Codes.
            </p>
          )}
        </div>
        <div className="flex gap-3">
          <a href={`/manage?code=${company.code}`} className="font-semibold text-sm" style={{ color: 'var(--text-muted)' }}>← Manage</a>
          {hasTokens && <PrintButton />}
        </div>
      </div>

      {/* Pages 1 & 2: tickets */}
      <PrintTickets tickets={tickets} />

      {/* Screen-only page break indicator */}
      <div className="print:hidden" style={{
        textAlign: 'center', padding: '1rem', fontSize: '0.75rem', color: '#aaa',
        borderTop: '2px dashed #ddd', borderBottom: '2px dashed #ddd', background: '#fafafa',
      }}>
        — page break — draw register —
      </div>

      {/* Page 3: draw register */}
      <div style={{ pageBreakBefore: 'always', breakBefore: 'page', background: '#fff', padding: '8mm' }}>

        {/* Header */}
        <div style={{
          background: '#4D10C8', borderRadius: '2mm', padding: '4mm 6mm',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '5mm',
        }}>
          <div>
            <p style={{ margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: '7pt', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
              FIFA World Cup · 2026
            </p>
            <p style={{ margin: '1mm 0 0', fontFamily: 'system-ui, sans-serif', fontSize: '14pt', fontWeight: 900, color: '#fff', lineHeight: 1, letterSpacing: '0.01em' }}>
              Draw Register — {company.name}
            </p>
          </div>
          <p style={{ margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: '8pt', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
            Date: ____________________
          </p>
        </div>

        {/* Instruction */}
        <p style={{ margin: '0 0 4mm', fontFamily: 'system-ui, sans-serif', fontSize: '7.5pt', color: '#6b6760' }}>
          Write each participant&apos;s name next to the team they drew. Keep as your backup record.
        </p>

        {/* Two-column group grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 6mm' }}>
          <div>
            {LEFT_GROUPS.map(letter => (
              <GroupBlock key={letter} letter={letter} teams={GROUPS_2026[letter]} />
            ))}
          </div>
          <div>
            {RIGHT_GROUPS.map(letter => (
              <GroupBlock key={letter} letter={letter} teams={GROUPS_2026[letter]} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
