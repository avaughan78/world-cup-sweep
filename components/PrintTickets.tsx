'use client';

import QRCode from 'react-qr-code';

interface Ticket {
  team: string;
  flag: string;
  token: string | null;
  claimUrl: string | null;
}

export default function PrintTickets({ tickets }: { tickets: Ticket[] }) {
  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: #fff !important; }
        }
      `}</style>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '6mm',
        padding: '8mm',
        background: '#fff',
      }}>
        {tickets.map(({ team, flag, claimUrl }) => (
          <div
            key={team}
            style={{
              border: '1.5px solid #333',
              borderRadius: '6px',
              padding: '5mm 4mm',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3mm',
              pageBreakInside: 'avoid',
              background: '#fff',
              aspectRatio: '1.6 / 1',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '3rem', lineHeight: 1 }}>{flag}</span>
            <span style={{
              fontWeight: 900,
              fontSize: '0.85rem',
              textAlign: 'center',
              lineHeight: 1.2,
              color: '#111',
              fontFamily: 'system-ui, sans-serif',
            }}>
              {team}
            </span>
            {claimUrl ? (
              <div style={{ marginTop: '1mm' }}>
                <QRCode value={claimUrl} size={64} />
              </div>
            ) : (
              <span style={{ fontSize: '0.65rem', color: '#999' }}>No token</span>
            )}
            <span style={{
              fontSize: '0.55rem',
              color: '#aaa',
              fontFamily: 'system-ui, sans-serif',
              textAlign: 'center',
            }}>
              FIFA World Cup 2026
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
