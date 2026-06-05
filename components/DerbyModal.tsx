'use client';

import { useState } from 'react';

export default function DerbyModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span>
        The{' '}
        <span
          onClick={() => setOpen(true)}
          style={{ cursor: 'pointer', borderBottom: '1px dotted currentColor' }}
          title="Read the story"
        >
          Derby County
        </span>
        {' '}Award
      </span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,8,6,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl overflow-hidden"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
              maxHeight: '90vh',
              overflowY: 'auto',
              scrollbarWidth: 'none',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="px-6 pt-6 pb-5"
              style={{ background: 'linear-gradient(135deg, #1c3f6e 0%, #ffffff 50%, #1c3f6e 100%)' }}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm"
                style={{ background: 'rgba(28,63,110,0.2)', color: '#1c3f6e', border: '1px solid rgba(28,63,110,0.3)' }}
              >
                ✕
              </button>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(28,63,110,0.7)' }}>
                🪣 Premier League · 2007–08
              </p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: '#1c3f6e' }}>
                Derby County — 2008
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4" style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
              <p>
                Derby County&apos;s 2007–08 Premier League campaign stands as the worst in the history of
                England&apos;s top flight. Under manager{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Billy Davies</strong> and then{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Paul Jewell</strong>, the Rams finished
                the season with a record-breaking{' '}
                <strong style={{ color: 'var(--text-primary)' }}>11 points</strong> — the lowest total
                ever recorded in the Premier League era.
              </p>
              <p>
                They won just{' '}
                <strong style={{ color: 'var(--text-primary)' }}>one match</strong> all season — a{' '}
                <strong style={{ color: 'var(--text-primary)' }}>1–0 home win over Newcastle</strong> in
                September 2007 — drawing eight and losing{' '}
                <strong style={{ color: 'var(--text-primary)' }}>29 times</strong> in 38 games.
              </p>
              <p>
                Their defensive record was equally catastrophic:{' '}
                <strong style={{ color: 'var(--text-primary)' }}>89 goals conceded</strong> at a rate of
                more than two per game, with a goal difference of{' '}
                <strong style={{ color: 'var(--text-primary)' }}>−69</strong>. They scored just 20 goals
                all season — fewer than any other top-flight side in the Premier League&apos;s history.
              </p>
              <p>
                The campaign yielded a series of records that still stand today: fewest wins (1), fewest
                points (11), and worst goal difference (−69) in a 38-game Premier League season. They were
                relegated by{' '}
                <strong style={{ color: 'var(--text-primary)' }}>March</strong> — the earliest a team has
                ever been mathematically relegated in the Premier League.
              </p>
              <p>
                Paul Jewell later described taking the Derby job as &ldquo;the biggest mistake of my life.&rdquo;
              </p>
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />
            <div className="px-6 py-3">
              <a
                href="https://en.wikipedia.org/wiki/2007%E2%80%9308_Derby_County_F.C._season"
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
              >
                Source: Wikipedia
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
