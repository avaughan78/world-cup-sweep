import { redirect } from 'next/navigation';
import { getCompanyByCode } from '@/lib/db';
import QRCode from 'react-qr-code';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const HOST_FLAGS = [
  { code: 'us', label: 'USA' },
  { code: 'ca', label: 'Canada' },
  { code: 'mx', label: 'Mexico' },
];

const STEPS = [
  {
    icon: '🎩',
    title: 'Draw from the hat',
    body: 'Everyone picks a folded ticket at random. That\'s your nation for the whole tournament.',
  },
  {
    icon: '📱',
    title: 'Claim your team',
    body: 'Scan the QR code on your ticket to put your name against your nation. Works on any phone.',
  },
  {
    icon: '📊',
    title: 'Follow live',
    body: 'Standings, cards, top scorers, and prize leaders tracked in real time on the sweep page.',
  },
];

interface PrizeDef {
  icon: string;
  name: string;
  tagline: string;
  share: number;
  mystery?: boolean;
}

const PRIZES: PrizeDef[] = [
  { icon: '🏆', name: 'Tournament Winner',  tagline: 'Goes all the way to lift the trophy',        share: 0.50 },
  { icon: '🥈', name: 'Runner-Up',          tagline: 'Finalist — so close, yet so far',            share: 0.25 },
  { icon: '👟', name: 'The Golden Boot',    tagline: "Nation of the tournament's top scorer",      share: 0.05 },
  { icon: '✈️', name: 'Early Bath',         tagline: 'First nation knocked out — gone but rich',   share: 0.05 },
  { icon: '🪣', name: 'Derby County',       tagline: 'Most goals conceded — a leaky defence pays', share: 0.05 },
  { icon: '🟨', name: 'Most Cards',         tagline: 'Filthiest team — yellow & red cards count',  share: 0.05 },
  { icon: '🚀', name: 'The Thunderbastard', tagline: 'Longest range goal of the whole tournament', share: 0.05 },
];

const MYSTERY_PRIZES: PrizeDef[] = [
  { icon: '😬', name: 'OG',          tagline: 'Most spectacular own goal',        share: 0, mystery: true },
  { icon: '🤸', name: 'The Bicycle', tagline: 'Best overhead kick of the tournament', share: 0, mystery: true },
];

function formatAmt(n: number): string {
  return n % 1 === 0 ? `£${n}` : `£${n.toFixed(2)}`;
}

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

  const pot = company.ticket_price != null ? company.ticket_price * 48 : null;

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
            height: '58mm',
            flexShrink: 0,
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.55) 100%)',
            }} />

            <div style={{ position: 'relative', zIndex: 1, height: '100%', padding: '6mm 12mm', display: 'flex', gap: '4mm' }}>

              {/* Left: tournament info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <p className="oswald" style={{ margin: 0, fontSize: '9pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)' }}>
                  FIFA World Cup · USA · Canada · Mexico
                </p>
                <div>
                  <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '10.5pt', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffcc00' }}>
                    Kicks off
                  </p>
                  <p className="bungee" style={{ margin: 0, fontSize: '28pt', lineHeight: 0.95, color: '#fff', letterSpacing: '0.01em', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                    11 June
                  </p>
                  <p className="bungee" style={{ margin: '1.5mm 0 0', fontSize: '16pt', lineHeight: 1, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.01em' }}>
                    2026
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '3mm', alignItems: 'center' }}>
                  {HOST_FLAGS.map(({ code: fc, label }) => (
                    <div key={fc} style={{ display: 'flex', alignItems: 'center', gap: '1.5mm' }}>
                      <img
                        src={`https://flagcdn.com/w40/${fc}.png`}
                        alt={label}
                        style={{ height: '12px', width: 'auto', borderRadius: '1px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }}
                      />
                      <span className="oswald" style={{ fontSize: '8pt', fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: trophy + sweep name */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', gap: '2mm', flexShrink: 0 }}>
                <img src="/world-cup-trophy.png" alt="World Cup trophy" style={{
                  height: '35mm', width: 'auto', opacity: 0.88,
                  filter: 'brightness(1.1) drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                }} />
                <p className="bungee" style={{ margin: 0, fontSize: '12pt', color: '#fff', letterSpacing: '0.04em', lineHeight: 1, textAlign: 'right', textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                  WC26 Sweep
                </p>
              </div>
            </div>
          </div>

          {/* ── PRIZE CENTREPIECE ────────────────────────────────── */}
          <div style={{ background: '#fff', padding: '5mm 12mm 6mm', flexShrink: 0 }}>
            <p className="bungee" style={{ margin: '0 0 0.5mm', fontSize: '18pt', color: '#1a1a17', lineHeight: 1, letterSpacing: '0.01em' }}>
              7 ways to win. 48 nations.
            </p>
            <p className="oswald" style={{ margin: '0 0 4mm', fontSize: '11.5pt', fontWeight: 400, color: '#6b6760', letterSpacing: '0.03em' }}>
              Draw any nation — <em>every team has a prize to play for.</em>
            </p>

            {/* Prize grid: 2 columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5mm' }}>
              {PRIZES.map((p) => {
                const amt = pot != null ? formatAmt(pot * p.share) : null;
                return (
                  <div key={p.name} style={{
                    background: '#f5f4ee',
                    border: '1px solid #e5e2d8',
                    borderRadius: '2.5mm',
                    padding: '3mm 3.5mm',
                    display: 'flex',
                    gap: '2.5mm',
                    alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '14pt', lineHeight: 1, flexShrink: 0 }}>{p.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="oswald" style={{ margin: 0, fontSize: '9.5pt', fontWeight: 700, color: '#1a1a17', letterSpacing: '0.03em', lineHeight: 1.1 }}>
                        {p.name}
                      </p>
                      <p style={{ margin: '0.5mm 0 0', fontSize: '7pt', color: '#8a8678', lineHeight: 1.3, fontFamily: 'system-ui, sans-serif' }}>
                        {p.tagline}
                      </p>
                    </div>
                    {amt && (
                      <div style={{
                        background: '#4D10C8',
                        borderRadius: '1.5mm',
                        padding: '1mm 2mm',
                        flexShrink: 0,
                      }}>
                        <p className="bungee" style={{ margin: 0, fontSize: '9.5pt', color: '#fff', lineHeight: 1, letterSpacing: '0.02em' }}>
                          {amt}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mystery prizes note */}
            <div style={{ marginTop: '3mm', textAlign: 'center' }}>
              <p className="oswald" style={{ margin: '0 0 2mm', fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#8a8678' }}>
                Plus mystery prizes — arranged by the organiser
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '4mm', flexWrap: 'wrap' }}>
                {MYSTERY_PRIZES.map(m => (
                  <div key={m.name} style={{
                    display: 'flex', alignItems: 'center', gap: '1.5mm',
                    background: '#f5f4ee',
                    border: '1px solid #e5e2d8',
                    borderRadius: '2mm',
                    padding: '1.5mm 3mm',
                  }}>
                    <span style={{ fontSize: '10pt', lineHeight: 1 }}>{m.icon}</span>
                    <div>
                      <p className="oswald" style={{ margin: 0, fontSize: '8.5pt', fontWeight: 700, color: '#3a3830', lineHeight: 1 }}>{m.name}</p>
                      <p style={{ margin: 0, fontSize: '6.5pt', color: '#8a8678', fontFamily: 'system-ui, sans-serif', lineHeight: 1.2 }}>{m.tagline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── HOW IT WORKS ─────────────────────────────────────── */}
          <div style={{ background: '#f5f4ee', padding: '4.5mm 12mm', flexShrink: 0 }}>
            <p className="oswald" style={{ margin: '0 0 3mm', fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#4D10C8' }}>
              How it works
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2.5mm' }}>
              {STEPS.map(step => (
                <div key={step.title} style={{
                  background: '#fff',
                  borderRadius: '2.5mm',
                  padding: '3.5mm',
                  border: '1px solid #e5e2d8',
                  display: 'flex',
                  gap: '2.5mm',
                  alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: '12pt', flexShrink: 0, lineHeight: 1, marginTop: '0.5mm' }}>{step.icon}</span>
                  <div>
                    <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '9pt', fontWeight: 700, color: '#1a1a17', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {step.title}
                    </p>
                    <p style={{ margin: 0, fontSize: '7.5pt', color: '#6b6760', lineHeight: 1.4, fontFamily: 'system-ui, sans-serif' }}>
                      {step.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── JOIN ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, background: '#fff', padding: '4.5mm 12mm 5mm', display: 'flex', flexDirection: 'column', gap: '3.5mm' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '4mm' }}>
              <div>
                <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '8pt', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8a8678' }}>
                  Sweep organised by
                </p>
                <p className="bungee" style={{ margin: 0, fontSize: '17pt', color: '#4D10C8', lineHeight: 1 }}>
                  {company.name}
                </p>
              </div>
              {fee && (
                <div style={{
                  background: '#edf7f0',
                  border: '1.5px solid #3b7a52',
                  borderRadius: '3mm',
                  padding: '2.5mm 5mm',
                  textAlign: 'center',
                  flexShrink: 0,
                }}>
                  <p className="oswald" style={{ margin: '0 0 0.5mm', fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3b7a52' }}>
                    Entry fee
                  </p>
                  <p className="bungee" style={{ margin: 0, fontSize: '14pt', color: '#1a1a17', lineHeight: 1 }}>
                    {fee}
                  </p>
                  {pot != null && (
                    <p style={{ margin: '0.5mm 0 0', fontSize: '7pt', color: '#3b7a52', fontFamily: 'system-ui, sans-serif' }}>
                      {formatAmt(pot)} total pot
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Code + QR */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5mm', background: '#4D10C8', borderRadius: '4mm', padding: '4.5mm 6mm' }}>
              <div style={{ flex: 1 }}>
                <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '8pt', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                  Visit {displayUrl} and enter code
                </p>
                <p className="bungee" style={{ margin: 0, fontSize: '25pt', color: '#fff', letterSpacing: '0.15em', lineHeight: 1 }}>
                  {company.code}
                </p>
                <p className="oswald" style={{ margin: '2mm 0 0', fontSize: '9pt', color: 'rgba(255,255,255,0.7)', fontWeight: 400, lineHeight: 1.4 }}>
                  Claim your team after the draw, then follow live stats for the whole tournament.
                </p>
              </div>
              <div style={{ flexShrink: 0, background: '#fff', borderRadius: '2.5mm', padding: '3mm' }}>
                <QRCode value={joinUrl} size={64} />
              </div>
            </div>

          </div>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <div style={{
            background: '#4D10C8',
            padding: '3.5mm 12mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <p className="oswald" style={{ margin: 0, fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>
              48 teams · 104 matches · 3 host nations
            </p>
            <p className="bungee" style={{ margin: 0, fontSize: '9pt', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>
              11 Jun – 19 Jul 2026
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
