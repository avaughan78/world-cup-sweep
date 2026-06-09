'use client';

import QRCode from 'react-qr-code';

interface Ticket {
  team: string;
  flag: string;
  token: string | null;
  claimUrl: string | null;
}

function TicketCard({ team, flag, claimUrl }: Ticket) {
  return (
    <div style={{
      border: '1.5px solid #333',
      borderRadius: '5px',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'stretch',
      pageBreakInside: 'avoid',
      breakInside: 'avoid',
      background: '#fff',
      overflow: 'hidden',
    }}>
      {/* Left: team info */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4mm 5mm',
        gap: '2mm',
      }}>
        {flag
          ? <img src={flag} alt={`${team} flag`} style={{ width: '4rem', height: 'auto', display: 'block' }} />
          : <span style={{ fontSize: '3rem', lineHeight: 1 }}>🏳️</span>
        }
        <span style={{
          fontWeight: 900,
          fontSize: '1rem',
          lineHeight: 1.2,
          color: '#111',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {team}
        </span>
        <span style={{
          fontSize: '0.55rem',
          color: '#bbb',
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          FIFA World Cup 2026
        </span>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', background: '#ddd', flexShrink: 0 }} />

      {/* Right: QR code */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4mm',
        gap: '2mm',
        flexShrink: 0,
      }}>
        {claimUrl ? (
          <>
            <QRCode value={claimUrl} size={96} />
            <span style={{ fontSize: '0.55rem', color: '#999', fontFamily: 'system-ui, sans-serif' }}>
              scan to claim
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.7rem', color: '#ccc', fontFamily: 'system-ui, sans-serif' }}>No QR code</span>
        )}
      </div>
    </div>
  );
}

const PER_PAGE = 14; // 2 columns × 7 rows

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '5mm',
  background: '#fff',
};

function chunk<T>(arr: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < arr.length; i += size) pages.push(arr.slice(i, i + size));
  return pages;
}

export default function PrintTickets({ tickets }: { tickets: Ticket[] }) {
  const pages = chunk(tickets, PER_PAGE);

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          body { background: #fff !important; }
          .print-page { page-break-after: always; break-after: page; }
        }
        @media screen {
          .ticket-sheet { padding: 8mm; background: #fff; }
        }
      `}</style>

      {pages.map((page, i) => (
        <div key={i}>
          <div className={`ticket-sheet${i < pages.length - 1 ? ' print-page' : ''}`} style={{ marginBottom: '0' }}>
            <div style={gridStyle}>
              {page.map(t => <TicketCard key={t.team} {...t} />)}
            </div>
          </div>

          {i < pages.length - 1 && (
            <div className="print:hidden" style={{
              textAlign: 'center',
              padding: '1rem',
              fontSize: '0.75rem',
              color: '#aaa',
              borderTop: '2px dashed #ddd',
              borderBottom: '2px dashed #ddd',
              margin: '0',
              background: '#fafafa',
            }}>
              — page break —
            </div>
          )}
        </div>
      ))}
    </>
  );
}
