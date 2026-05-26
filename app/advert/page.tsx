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

  const fee = company.ticket_price != null
    ? `£${company.ticket_price % 1 === 0 ? company.ticket_price : company.ticket_price.toFixed(2)} per ticket`
    : null;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
        }
        @media screen {
          body { background: #e5e5e5 !important; }
          .advert-sheet { box-shadow: 0 8px 40px rgba(0,0,0,0.18); }
        }
      `}</style>

      {/* Screen controls */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: '#1a1a17', borderBottom: '1px solid #333',
      }}>
        <a href={`/manage?code=${company.code}`} style={{ color: '#aaa', fontSize: '0.85rem', textDecoration: 'none' }}>
          ← Back to manage
        </a>
        <PrintButton />
      </div>

      {/* A4 sheet */}
      <div style={{ paddingTop: '4rem' }} className="no-print-pad">
        <div
          className="advert-sheet"
          style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '2rem auto',
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #4D10C8 0%, #D40100 100%)',
            backgroundImage: `linear-gradient(135deg, rgba(77,16,200,0.92) 0%, rgba(212,1,0,0.92) 100%), url(/wc2026-header-bg.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            padding: '14mm 14mm 12mm',
            color: '#fff',
          }}>
            <p style={{ fontSize: '9pt', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.7, margin: 0 }}>
              FIFA World Cup · USA · Canada · Mexico · 2026
            </p>
            <h1 style={{ fontSize: '38pt', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1, margin: '4mm 0 2mm' }}>
              {company.name}
            </h1>
            <p style={{ fontSize: '13pt', fontWeight: 600, opacity: 0.8, margin: 0 }}>
              Office Sweepstake
            </p>
          </div>

          {/* Body */}
          <div style={{ flex: 1, padding: '12mm 14mm', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8mm' }}>

            <p style={{ fontSize: '18pt', fontWeight: 800, color: '#1a1a17', textAlign: 'center', margin: 0, letterSpacing: '-0.01em' }}>
              Join the draw — pick your team!
            </p>

            {/* QR code */}
            <div style={{
              border: '2px solid #e5e2d8',
              borderRadius: '6mm',
              padding: '8mm',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4mm',
              background: '#fff',
            }}>
              <QRCode value={joinUrl} size={160} />
              <p style={{ fontSize: '8pt', color: '#8a8678', margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600 }}>
                Scan to view the draw
              </p>
            </div>

            {/* URL + code */}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '9pt', color: '#8a8678', margin: '0 0 1mm' }}>Or visit</p>
              <p style={{ fontSize: '10pt', fontWeight: 700, color: '#4D10C8', margin: '0 0 2mm', wordBreak: 'break-all' }}>
                {baseUrl.replace(/^https?:\/\//, '')}
              </p>
              <p style={{ fontSize: '9pt', color: '#8a8678', margin: '0 0 1mm' }}>and enter code</p>
              <p style={{
                fontSize: '22pt', fontWeight: 900, letterSpacing: '0.2em',
                color: '#1a1a17', margin: 0,
                background: '#f5f4ee', borderRadius: '3mm',
                padding: '2mm 6mm', display: 'inline-block',
              }}>
                {company.code}
              </p>
            </div>

            {/* Steps */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3mm' }}>
              {[
                { n: '1', text: 'Tickets are folded and drawn from a hat — one team per person.' },
                { n: '2', text: 'Scan the QR code on your ticket to register your name against your team.' },
                { n: '3', text: 'Follow the tournament live — standings, cards, and prize leaders tracked in real time.' },
              ].map(step => (
                <div key={step.n} style={{ display: 'flex', alignItems: 'flex-start', gap: '3mm' }}>
                  <span style={{
                    flexShrink: 0,
                    width: '6mm', height: '6mm',
                    background: '#4D10C8', color: '#fff',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '8pt', fontWeight: 900,
                  }}>{step.n}</span>
                  <p style={{ fontSize: '10pt', color: '#4d4a42', margin: 0, lineHeight: 1.5 }}>{step.text}</p>
                </div>
              ))}
            </div>

            {/* Entry fee */}
            {fee && (
              <div style={{
                width: '100%',
                background: '#f5f4ee',
                borderRadius: '3mm',
                padding: '4mm 6mm',
                display: 'flex',
                alignItems: 'center',
                gap: '3mm',
                border: '1px solid #e5e2d8',
              }}>
                <span style={{ fontSize: '14pt' }}>💰</span>
                <p style={{ fontSize: '11pt', fontWeight: 700, color: '#1a1a17', margin: 0 }}>
                  Entry fee: {fee}
                </p>
              </div>
            )}

          </div>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid #e5e2d8',
            padding: '5mm 14mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <p style={{ fontSize: '8pt', color: '#8a8678', margin: 0 }}>
              48 teams · 104 matches · 3 host nations
            </p>
            <p style={{ fontSize: '8pt', color: '#8a8678', margin: 0, fontWeight: 700 }}>
              11 Jun – 19 Jul 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
