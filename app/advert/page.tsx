import { redirect } from 'next/navigation';
import { getCompanyByCode } from '@/lib/db';
import QRCode from 'react-qr-code';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

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
        @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Oswald:wght@400;600;700&display=swap');

        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        @media screen {
          body { background: #1a1a17 !important; margin: 0 !important; }
          .advert-sheet { box-shadow: 0 20px 80px rgba(0,0,0,0.6); }
        }

        .bungee { font-family: var(--font-bungee), 'Bungee', system-ui, sans-serif !important; }
        .oswald { font-family: var(--font-caveat), 'Oswald', system-ui, sans-serif !important; }
      `}</style>

      {/* Screen toolbar */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: '#0f0f0d',
        borderBottom: '1px solid #2e2e28',
      }}>
        <a href={`/manage?code=${company.code}`} style={{ color: '#6b6760', fontSize: '0.85rem', textDecoration: 'none', fontFamily: 'system-ui, sans-serif' }}>
          ← Back to manage
        </a>
        <PrintButton />
      </div>

      {/* A4 sheet */}
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
            position: 'relative',
          }}
        >

          {/* ── HERO ────────────────────────────────────────────── */}
          <div style={{
            position: 'relative',
            height: '88mm',
            overflow: 'hidden',
            flexShrink: 0,
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
          }}>
            {/* Gradient overlay — left-heavy so text is legible */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(105deg, rgba(10,0,55,0.96) 0%, rgba(10,0,55,0.82) 45%, rgba(180,0,0,0.55) 75%, rgba(180,0,0,0.35) 100%)',
            }} />

            {/* Trophy — right side */}
            <img
              src="/world-cup-trophy.png"
              alt=""
              style={{
                position: 'absolute',
                right: '-4mm',
                bottom: '-6mm',
                height: '100mm',
                width: 'auto',
                opacity: 0.35,
                filter: 'drop-shadow(0 0 20px rgba(255,200,0,0.3))',
              }}
            />

            {/* Text content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '10mm 12mm', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

              {/* Top: tournament label */}
              <div>
                <p className="oswald" style={{
                  margin: 0,
                  fontSize: '8pt',
                  fontWeight: 700,
                  letterSpacing: '0.22em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.55)',
                }}>
                  FIFA World Cup&nbsp;&nbsp;·&nbsp;&nbsp;USA · Canada · Mexico
                </p>
                <p className="bungee" style={{
                  margin: '3mm 0 0',
                  fontSize: '44pt',
                  lineHeight: 0.9,
                  color: '#fff',
                  letterSpacing: '-0.01em',
                }}>
                  2026
                </p>
              </div>

              {/* Bottom: host flags */}
              <div style={{ display: 'flex', gap: '3mm', alignItems: 'center' }}>
                {['🇺🇸', '🇨🇦', '🇲🇽'].map(flag => (
                  <span key={flag} style={{ fontSize: '18pt', lineHeight: 1 }}>{flag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── COMPANY NAME BAND ────────────────────────────────── */}
          <div style={{
            background: '#D40100',
            padding: '5mm 12mm',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5mm',
            flexShrink: 0,
          }}>
            <p className="oswald" style={{
              margin: 0,
              fontSize: '7.5pt',
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.65)',
            }}>
              Office Sweepstake
            </p>
            <p className="bungee" style={{
              margin: 0,
              fontSize: '28pt',
              lineHeight: 1,
              color: '#fff',
              letterSpacing: '0.01em',
            }}>
              {company.name}
            </p>
          </div>

          {/* ── BODY ─────────────────────────────────────────────── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '8mm 12mm', gap: '6mm' }}>

            {/* Headline */}
            <div>
              <p className="bungee" style={{
                margin: 0,
                fontSize: '22pt',
                lineHeight: 1.05,
                color: '#0a0037',
                letterSpacing: '0.01em',
              }}>
                Join the draw.
              </p>
              <p className="oswald" style={{
                margin: '1.5mm 0 0',
                fontSize: '12pt',
                fontWeight: 400,
                color: '#4d4a42',
                lineHeight: 1.4,
              }}>
                Pick a team from the hat and follow them all the way to the final.
              </p>
            </div>

            {/* QR + code — two column */}
            <div style={{
              display: 'flex',
              gap: '8mm',
              alignItems: 'stretch',
            }}>
              {/* QR */}
              <div style={{
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3mm',
                background: '#f5f4ee',
                borderRadius: '4mm',
                padding: '6mm',
                border: '1.5px solid #e5e2d8',
              }}>
                <QRCode value={joinUrl} size={130} />
                <p className="oswald" style={{
                  margin: 0,
                  fontSize: '7pt',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#8a8678',
                }}>
                  Scan to join
                </p>
              </div>

              {/* URL + code + steps */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '4mm' }}>

                {/* URL + code box */}
                <div style={{
                  background: '#0a0037',
                  borderRadius: '4mm',
                  padding: '5mm 6mm',
                  color: '#fff',
                }}>
                  <p className="oswald" style={{ margin: '0 0 1mm', fontSize: '7pt', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    Or visit
                  </p>
                  <p className="oswald" style={{ margin: '0 0 3mm', fontSize: '10pt', fontWeight: 700, color: '#a78bfa', wordBreak: 'break-all' }}>
                    {displayUrl}
                  </p>
                  <p className="oswald" style={{ margin: '0 0 1.5mm', fontSize: '7pt', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    Enter code
                  </p>
                  <p className="bungee" style={{
                    margin: 0,
                    fontSize: '20pt',
                    letterSpacing: '0.12em',
                    color: '#fff',
                    lineHeight: 1,
                  }}>
                    {company.code}
                  </p>
                </div>

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5mm' }}>
                  {[
                    ['🎩', 'Draw a team from the hat'],
                    ['📱', 'Scan your ticket QR to claim'],
                    ['📊', 'Follow the tournament live'],
                  ].map(([icon, text]) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
                      <span style={{ fontSize: '11pt', flexShrink: 0, width: '5mm', textAlign: 'center' }}>{icon}</span>
                      <p className="oswald" style={{ margin: 0, fontSize: '9pt', fontWeight: 400, color: '#4d4a42', lineHeight: 1.3 }}>{text}</p>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* Entry fee */}
            {fee && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4mm',
                background: '#fff8e6',
                border: '1.5px solid #f0c060',
                borderRadius: '4mm',
                padding: '4mm 6mm',
              }}>
                <span style={{ fontSize: '16pt', flexShrink: 0 }}>🏆</span>
                <div>
                  <p className="oswald" style={{ margin: 0, fontSize: '7pt', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8a6a00' }}>Entry fee</p>
                  <p className="bungee" style={{ margin: 0, fontSize: '16pt', color: '#1a1a17', lineHeight: 1 }}>{fee} per ticket</p>
                </div>
              </div>
            )}

          </div>

          {/* ── FOOTER ───────────────────────────────────────────── */}
          <div style={{
            background: '#0a0037',
            padding: '5mm 12mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <p className="oswald" style={{
              margin: 0,
              fontSize: '8pt',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.45)',
            }}>
              48 teams · 104 matches · 3 host nations
            </p>
            <p className="bungee" style={{
              margin: 0,
              fontSize: '9pt',
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '0.05em',
            }}>
              11 Jun – 19 Jul 2026
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
