import { redirect } from 'next/navigation';
import { getCompanyByCode } from '@/lib/db';
import { GROUPS_2026 } from '@/lib/groups';
import { getFlag } from '@/lib/flags';
import QRCode from 'react-qr-code';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const ALL_TEAMS = Object.values(GROUPS_2026).flat();

const STEPS = [
  {
    icon: '🖨️',
    title: 'Print the tickets',
    body: 'The organiser prints a QR-coded ticket for each of the 48 nations and cuts them up.',
  },
  {
    icon: '🎩',
    title: 'Draw from the hat',
    body: 'Everyone picks a folded ticket at random. That\'s your nation for the entire tournament.',
  },
  {
    icon: '📱',
    title: 'Claim your team',
    body: 'Scan the QR code on your ticket to put your name against your nation. Works on any phone.',
  },
  {
    icon: '📊',
    title: 'Follow live',
    body: 'Standings, cards, top scorers, and prize leaders are all tracked in real time on this page.',
  },
];

export default async function AdvertPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params.code?.trim().toUpperCase();

  if (!code) redirect('/manage');

  const company = await getCompanyByCode(code);
  if (!company) redirect('/manage');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    ?? (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : 'http://localhost:3000');

  const joinUrl = `${baseUrl}/?code=${company.code}`;
  const displayUrl = baseUrl.replace(/^https?:\/\//, '');

  const fee = company.ticket_price != null
    ? `£${company.ticket_price % 1 === 0 ? company.ticket_price : company.ticket_price.toFixed(2)}`
    : null;

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
          .advert-sheet { box-shadow: 0 20px 80px rgba(0,0,0,0.7); }
        }
        .bungee { font-family: var(--font-bungee), 'Bungee', Impact, sans-serif !important; }
        .oswald { font-family: var(--font-caveat), 'Oswald', Arial Narrow, sans-serif !important; }
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
        <div
          className="advert-sheet"
          style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '1.5rem auto',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >

          {/* ── HERO ─────────────────────────────────────────────── */}
          <div style={{
            position: 'relative',
            height: '82mm',
            flexShrink: 0,
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 35%',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(110deg, rgba(8,0,45,0.97) 0%, rgba(8,0,45,0.88) 50%, rgba(140,0,0,0.7) 100%)',
            }} />

            {/* Faded trophy */}
            <img src="/world-cup-trophy.png" alt="" style={{
              position: 'absolute', right: '-8mm', bottom: '-10mm',
              height: '105mm', width: 'auto', opacity: 0.18,
              filter: 'brightness(2)',
            }} />

            <div style={{ position: 'relative', zIndex: 1, height: '100%', padding: '8mm 12mm', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

              {/* Tournament label */}
              <p className="oswald" style={{ margin: 0, fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
                FIFA World Cup · USA · Canada · Mexico
              </p>

              {/* Big date centrepiece */}
              <div>
                <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '11pt', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ff4040' }}>
                  Kicks off
                </p>
                <p className="bungee" style={{ margin: 0, fontSize: '36pt', lineHeight: 0.95, color: '#fff', letterSpacing: '0.01em' }}>
                  11 June
                </p>
                <p className="bungee" style={{ margin: '1mm 0 0', fontSize: '20pt', lineHeight: 1, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.01em' }}>
                  2026
                </p>
              </div>

              {/* Host flags + final date */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '2.5mm', alignItems: 'center' }}>
                  {['🇺🇸', '🇨🇦', '🇲🇽'].map(f => (
                    <span key={f} style={{ fontSize: '16pt', lineHeight: 1 }}>{f}</span>
                  ))}
                </div>
                <p className="oswald" style={{ margin: 0, fontSize: '8pt', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Final · 19 July 2026
                </p>
              </div>
            </div>
          </div>

          {/* ── HOOK BAR ─────────────────────────────────────────── */}
          <div style={{ background: '#D40100', padding: '5mm 12mm' }}>
            <p className="bungee" style={{ margin: '0 0 1mm', fontSize: '19pt', color: '#fff', lineHeight: 1, letterSpacing: '0.01em' }}>
              48 nations. One winner.
            </p>
            <p className="oswald" style={{ margin: 0, fontSize: '11pt', fontWeight: 400, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.03em' }}>
              Which team will <em>you</em> draw?
            </p>
          </div>

          {/* ── ALL 48 TEAMS ─────────────────────────────────────── */}
          <div style={{ background: '#08002d', padding: '5mm 12mm' }}>
            <p className="oswald" style={{ margin: '0 0 3.5mm', fontSize: '7pt', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
              The 48 nations
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2.5mm 1mm' }}>
              {ALL_TEAMS.map(team => (
                <div key={team} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8mm' }}>
                  <span style={{ fontSize: '13pt', lineHeight: 1 }}>{getFlag(team)}</span>
                  <span style={{
                    fontFamily: 'system-ui, sans-serif',
                    fontSize: '4pt',
                    color: 'rgba(255,255,255,0.45)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    wordBreak: 'break-word',
                    hyphens: 'auto',
                    maxWidth: '13mm',
                  }}>
                    {team}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── HOW IT WORKS ─────────────────────────────────────── */}
          <div style={{ background: '#f5f4ee', padding: '6mm 12mm' }}>
            <p className="oswald" style={{ margin: '0 0 4mm', fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8a8678' }}>
              How it works
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3mm' }}>
              {STEPS.map(step => (
                <div key={step.title} style={{
                  background: '#fff',
                  borderRadius: '3mm',
                  padding: '4mm',
                  border: '1px solid #e5e2d8',
                  display: 'flex',
                  gap: '3mm',
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '14pt', flexShrink: 0, lineHeight: 1, marginTop: '0.5mm' }}>{step.icon}</span>
                  <div>
                    <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '8.5pt', fontWeight: 700, color: '#1a1a17', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {step.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '7.5pt', color: '#6b6760', lineHeight: 1.45, fontFamily: 'system-ui, sans-serif' }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── JOIN ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, background: '#fff', padding: '6mm 12mm', display: 'flex', flexDirection: 'column', gap: '4mm' }}>

            {/* Company + entry fee */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4mm' }}>
              <div>
                <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '7pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a8678' }}>
                  Sweepstake organised by
                </p>
                <p className="bungee" style={{ margin: 0, fontSize: '18pt', color: '#08002d', lineHeight: 1, letterSpacing: '0.01em' }}>
                  {company.name}
                </p>
              </div>
              {fee && (
                <div style={{
                  background: '#fff8e6',
                  border: '1.5px solid #f0c060',
                  borderRadius: '3mm',
                  padding: '3mm 5mm',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  <p className="oswald" style={{ margin: '0 0 0.5mm', fontSize: '6pt', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a6a00' }}>
                    Entry
                  </p>
                  <p className="bungee" style={{ margin: 0, fontSize: '14pt', color: '#1a1a17', lineHeight: 1 }}>
                    {fee}
                  </p>
                </div>
              )}
            </div>

            {/* Code + QR side by side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm', background: '#08002d', borderRadius: '4mm', padding: '5mm 6mm' }}>
              <div style={{ flex: 1 }}>
                <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '7pt', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
                  Visit {displayUrl} and enter
                </p>
                <p className="bungee" style={{ margin: 0, fontSize: '24pt', color: '#fff', letterSpacing: '0.15em', lineHeight: 1 }}>
                  {company.code}
                </p>
                <p className="oswald" style={{ margin: '2mm 0 0', fontSize: '7pt', color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                  Or scan the QR code once the draw has started
                </p>
              </div>
              <div style={{ flexShrink: 0, background: '#fff', borderRadius: '2.5mm', padding: '3mm' }}>
                <QRCode value={joinUrl} size={68} />
              </div>
            </div>

          </div>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <div style={{
            background: '#08002d',
            padding: '4mm 12mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <p className="oswald" style={{ margin: 0, fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
              48 teams · 104 matches · 3 host nations
            </p>
            <p className="bungee" style={{ margin: 0, fontSize: '8pt', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>
              11 Jun – 19 Jul 2026
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
