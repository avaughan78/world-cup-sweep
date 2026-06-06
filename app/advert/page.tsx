import { redirect } from 'next/navigation';
import { getCompanyByCode } from '@/lib/db';
import { GROUPS_2026 } from '@/lib/groups';
import { getFlagUrl } from '@/lib/flags';
import QRCode from 'react-qr-code';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const ALL_TEAMS = Object.values(GROUPS_2026).flat();

const HOST_FLAGS = [
  { code: 'us', label: 'USA' },
  { code: 'ca', label: 'Canada' },
  { code: 'mx', label: 'Mexico' },
];

const STEPS = [
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
    body: 'Standings, cards, top scorers, and category leaders are all tracked in real time on this page.',
  },
];

const PRIZE_CATEGORIES = [
  { icon: '🏆', name: 'The Winner',              desc: 'Team that goes furthest' },
  { icon: '👟', name: 'The Golden Boot',          desc: 'Top scorer\'s team' },
  { icon: '✈️', name: 'Early Bath',               desc: 'First team out' },
  { icon: '🪣', name: 'Derby County',             desc: 'Most goals conceded' },
  { icon: '🟨', name: 'Most Cards',               desc: 'Yellow & red card leaders' },
  { icon: '🚀', name: 'The Thunderbastard',       desc: 'Longest-range goal' },
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

          {/* ── HERO — same background image as the main site header ── */}
          <div style={{
            position: 'relative',
            height: '65mm',
            flexShrink: 0,
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
          }}>
            {/* Subtle gradient only at the bottom to lift text — matches main site style */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
            }} />

            <div style={{ position: 'relative', zIndex: 1, height: '100%', padding: '7mm 12mm', display: 'flex', gap: '4mm' }}>

              {/* Left: tournament info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <p className="oswald" style={{ margin: 0, fontSize: '9pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                  FIFA World Cup · USA · Canada · Mexico
                </p>
                <div>
                  <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '10.5pt', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffcc00' }}>
                    Kicks off
                  </p>
                  <p className="bungee" style={{ margin: 0, fontSize: '30pt', lineHeight: 0.95, color: '#fff', letterSpacing: '0.01em', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                    11 June
                  </p>
                  <p className="bungee" style={{ margin: '1.5mm 0 0', fontSize: '17pt', lineHeight: 1, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.01em' }}>
                    2026
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '3mm', alignItems: 'center' }}>
                  {HOST_FLAGS.map(({ code, label }) => (
                    <div key={code} style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                      <img
                        src={`https://flagcdn.com/w40/${code}.png`}
                        alt={label}
                        style={{ height: '13px', width: 'auto', borderRadius: '1px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                      />
                      <span className="oswald" style={{ fontSize: '8.5pt', fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: trophy + sweep name */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '2mm', flexShrink: 0 }}>
                <img src="/world-cup-trophy.png" alt="World Cup trophy" style={{
                  height: '38mm', width: 'auto', opacity: 0.88,
                  filter: 'brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }} />
                <p className="bungee" style={{ margin: 0, fontSize: '13pt', color: '#fff', letterSpacing: '0.04em', lineHeight: 1, textAlign: 'right', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                  WC26 Sweep
                </p>
              </div>

            </div>
          </div>

          {/* ── HOOK BAR ─────────────────────────────────────────── */}
          <div style={{ background: '#D40100', padding: '5mm 12mm' }}>
            <p className="bungee" style={{ margin: '0 0 1mm', fontSize: '19pt', color: '#fff', lineHeight: 1, letterSpacing: '0.01em' }}>
              48 nations. One World Cup.
            </p>
            <p className="oswald" style={{ margin: 0, fontSize: '12.5pt', fontWeight: 400, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.03em' }}>
              Which team will <em>you</em> draw?
            </p>
          </div>

          {/* ── ALL 48 TEAMS ─────────────────────────────────────── */}
          <div style={{ background: '#f5f4ee', padding: '4mm 12mm' }}>
            <p className="oswald" style={{ margin: '0 0 3mm', fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8a8678' }}>
              The 48 nations
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1.5mm 3mm' }}>
              {ALL_TEAMS.map(team => {
                const url = getFlagUrl(team);
                return (
                  <div key={team} style={{ display: 'flex', alignItems: 'center', gap: '2mm', minWidth: 0 }}>
                    <div style={{ width: '22px', height: '15px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {url ? (
                        <img
                          src={url}
                          alt={team}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block', borderRadius: '1px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}
                        />
                      ) : (
                        <span style={{ fontSize: '10pt', lineHeight: 1 }}>🏳️</span>
                      )}
                    </div>
                    <span style={{
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: '7.5pt',
                      color: '#3a3830',
                      lineHeight: 1.25,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}>
                      {team}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── PRIZE CATEGORIES ─────────────────────────────────── */}
          <div style={{ background: '#1a1816', padding: '5mm 12mm' }}>
            <p className="oswald" style={{ margin: '0 0 3.5mm', fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              Prize categories
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2mm 4mm' }}>
              {PRIZE_CATEGORIES.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
                  <span style={{ fontSize: '13pt', lineHeight: 1, flexShrink: 0 }}>{p.icon}</span>
                  <div>
                    <p className="oswald" style={{ margin: 0, fontSize: '9.5pt', fontWeight: 700, color: '#fff', letterSpacing: '0.02em', lineHeight: 1.1 }}>
                      {p.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '7.5pt', color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui, sans-serif', lineHeight: 1.3 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── HOW IT WORKS ─────────────────────────────────────── */}
          <div style={{ background: '#fff', padding: '5mm 12mm' }}>
            <p className="oswald" style={{ margin: '0 0 3.5mm', fontSize: '9pt', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4D10C8' }}>
              How it works
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3mm' }}>
              {STEPS.map(step => (
                <div key={step.title} style={{
                  background: '#f5f4ee',
                  borderRadius: '3mm',
                  padding: '4mm',
                  border: '1px solid #e5e2d8',
                  display: 'flex',
                  gap: '3mm',
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '13pt', flexShrink: 0, lineHeight: 1, marginTop: '0.5mm' }}>{step.icon}</span>
                  <div>
                    <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '9.5pt', fontWeight: 700, color: '#1a1a17', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {step.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '8pt', color: '#6b6760', lineHeight: 1.4, fontFamily: 'system-ui, sans-serif' }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── JOIN ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, background: '#fff', padding: '5mm 12mm 6mm', display: 'flex', flexDirection: 'column', gap: '4mm' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4mm' }}>
              <div>
                <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a8678' }}>
                  Sweep organised by
                </p>
                <p className="bungee" style={{ margin: 0, fontSize: '18pt', color: '#4D10C8', lineHeight: 1 }}>
                  {company.name}
                </p>
              </div>
              {fee && (
                <div style={{
                  background: '#edf7f0',
                  border: '1.5px solid #3b7a52',
                  borderRadius: '3mm',
                  padding: '3mm 5mm',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  <p className="oswald" style={{ margin: '0 0 0.5mm', fontSize: '8pt', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3b7a52' }}>
                    Entry
                  </p>
                  <p className="bungee" style={{ margin: 0, fontSize: '14pt', color: '#1a1a17', lineHeight: 1 }}>
                    {fee}
                  </p>
                </div>
              )}
            </div>

            {/* Code + QR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm', background: '#4D10C8', borderRadius: '4mm', padding: '5mm 6mm' }}>
              <div style={{ flex: 1 }}>
                <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                  Visit {displayUrl} and enter code
                </p>
                <p className="bungee" style={{ margin: 0, fontSize: '26pt', color: '#fff', letterSpacing: '0.15em', lineHeight: 1 }}>
                  {company.code}
                </p>
                <p className="oswald" style={{ margin: '2mm 0 0', fontSize: '9.5pt', color: 'rgba(255,255,255,0.7)', fontWeight: 400, lineHeight: 1.4 }}>
                  When all names are drawn and entered onto the site you can follow the competition stats on this page:
                </p>
              </div>
              <div style={{ flexShrink: 0, background: '#fff', borderRadius: '2.5mm', padding: '3mm' }}>
                <QRCode value={joinUrl} size={68} />
              </div>
            </div>

          </div>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <div style={{
            background: '#4D10C8',
            padding: '4mm 12mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <p className="oswald" style={{ margin: 0, fontSize: '9pt', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              48 teams · 104 matches · 3 host nations
            </p>
            <p className="bungee" style={{ margin: 0, fontSize: '9.5pt', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>
              11 Jun – 19 Jul 2026
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
