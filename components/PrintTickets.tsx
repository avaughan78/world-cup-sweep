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
        padding: '3mm 4mm',
        gap: '1.5mm',
      }}>
        <span style={{ fontSize: '2rem', lineHeight: 1 }}>{flag}</span>
        <span style={{
          fontWeight: 900,
          fontSize: '0.85rem',
          lineHeight: 1.2,
          color: '#111',
          fontFamily: 'system-ui, sans-serif',
        }}>
          {team}
        </span>
        <span style={{
          fontSize: '0.45rem',
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
        padding: '3mm',
        gap: '1.5mm',
        flexShrink: 0,
      }}>
        {claimUrl ? (
          <>
            <QRCode value={claimUrl} size={76} />
            <span style={{ fontSize: '0.45rem', color: '#999', fontFamily: 'system-ui, sans-serif' }}>
              scan to claim
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.6rem', color: '#ccc', fontFamily: 'system-ui, sans-serif' }}>No QR code</span>
        )}
      </div>
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '4mm',
  background: '#fff',
};

export default function PrintTickets({ tickets }: { tickets: Ticket[] }) {
  const page1 = tickets.slice(0, 24);
  const page2 = tickets.slice(24);

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

      {/* Page 1 */}
      <div className="ticket-sheet print-page" style={{ marginBottom: '0' }}>
        <div style={gridStyle}>
          {page1.map(t => <TicketCard key={t.team} {...t} />)}
        </div>
      </div>

      {/* Screen-only page break indicator */}
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

      {/* Page 2 */}
      <div className="ticket-sheet" style={{ marginTop: '0' }}>
        <div style={gridStyle}>
          {page2.map(t => <TicketCard key={t.team} {...t} />)}
        </div>
      </div>
    </>
  );
}
