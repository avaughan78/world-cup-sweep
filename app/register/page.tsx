import { redirect } from 'next/navigation';
import { getCompanyByCode } from '@/lib/db';
import { GROUPS_2026 } from '@/lib/groups';
import { getFlagUrl } from '@/lib/flags';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const GROUP_KEYS = Object.keys(GROUPS_2026);
const LEFT_GROUPS  = GROUP_KEYS.slice(0, 6);   // A–F
const RIGHT_GROUPS = GROUP_KEYS.slice(6);       // G–L

function GroupBlock({ letter, teams }: { letter: string; teams: string[] }) {
  return (
    <div style={{ marginBottom: '4mm' }}>
      {/* Group header */}
      <div style={{
        background: '#4D10C8',
        padding: '2mm 3.5mm',
        borderRadius: '1.5mm 1.5mm 0 0',
        display: 'flex', alignItems: 'center', gap: '2mm',
      }}>
        <span style={{
          fontFamily: 'var(--font-bungee), Bungee, Impact, sans-serif',
          fontSize: '8pt', color: '#fff', letterSpacing: '0.04em',
        }}>
          Group {letter}
        </span>
      </div>

      {/* Team rows */}
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
              {/* Flag */}
              <div style={{ width: '22px', height: '15px', flexShrink: 0, display: 'flex', alignItems: 'center', marginBottom: '1mm' }}>
                {flagUrl ? (
                  <img src={flagUrl} alt={team} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '1px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', display: 'block' }} />
                ) : (
                  <span style={{ fontSize: '9pt' }}>🏳️</span>
                )}
              </div>

              {/* Team name */}
              <span style={{
                fontFamily: 'system-ui, sans-serif',
                fontSize: '7.5pt', fontWeight: 700, color: '#2a2820',
                lineHeight: 1.25, flexShrink: 0, width: '27mm',
              }}>
                {team}
              </span>

              {/* Write line */}
              <div style={{ flex: 1, borderBottom: '1.5px dashed #bbb', marginBottom: '1.5mm' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params.code?.trim().toUpperCase();
  if (!code) redirect('/manage');
  const company = await getCompanyByCode(code);
  if (!company) redirect('/manage');

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: #fff !important; margin: 0 !important; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @media screen {
          body { background: #111 !important; margin: 0 !important; }
          .register-sheet { box-shadow: 0 20px 80px rgba(0,0,0,0.7); }
        }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: '#0f0f0d', borderBottom: '1px solid #2a2a25',
      }}>
        <a href={`/manage?code=${company.code}`} style={{ color: '#6b6760', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>
          ← Back to manage
        </a>
        <PrintButton />
      </div>

      <div style={{ paddingTop: '3.5rem' }}>
        <div className="register-sheet" style={{
          width: '210mm', margin: '1.5rem auto', background: '#fff',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>

          {/* Header */}
          <div style={{
            position: 'relative', height: '22mm', flexShrink: 0,
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)' }} />
            <div style={{ position: 'relative', zIndex: 1, height: '100%', padding: '4mm 12mm', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ margin: '0 0 1mm', fontFamily: 'system-ui, sans-serif', fontSize: '7pt', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' }}>
                  FIFA World Cup · 2026
                </p>
                <p style={{ margin: 0, fontFamily: 'var(--font-bungee), Bungee, Impact, sans-serif', fontSize: '16pt', color: '#fff', letterSpacing: '0.02em', lineHeight: 1 }}>
                  Draw Register
                </p>
                <p style={{ margin: '1mm 0 0', fontFamily: 'system-ui, sans-serif', fontSize: '8pt', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                  {company.name}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: '7.5pt', color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>
                  Date: ____________________
                </p>
              </div>
            </div>
          </div>

          {/* Instruction bar */}
          <div style={{ background: '#D40100', padding: '2.5mm 12mm', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: '7.5pt', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              Write each participant&apos;s name next to the team they drew. Keep this as your backup record.
            </p>
            <p style={{ margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: '7.5pt', color: 'rgba(255,255,255,0.6)', fontWeight: 600, flexShrink: 0, marginLeft: '6mm' }}>
              48 teams · 48 names
            </p>
          </div>

          {/* Two-column group grid */}
          <div style={{ padding: '5mm 12mm 6mm', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 5mm' }}>
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

          {/* Footer */}
          <div style={{
            background: '#4D10C8', padding: '3mm 12mm',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              WC26 Sweep · {company.name}
            </p>
            <p style={{ margin: 0, fontFamily: 'system-ui, sans-serif', fontSize: '7.5pt', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              11 Jun – 19 Jul 2026
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
