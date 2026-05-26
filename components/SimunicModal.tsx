'use client';

import { useState } from 'react';

export default function SimunicModal({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span
        onClick={() => setOpen(true)}
        style={{ cursor: 'pointer', borderBottom: '1px dotted currentColor' }}
        title="Read the story"
      >
        {name}
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
              style={{ background: 'linear-gradient(135deg, #4D10C8 0%, #D40100 100%)' }}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                ✕
              </button>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
                🟨 Germany 2006
              </p>
              <h2 className="text-2xl font-black tracking-tight" style={{ color: '#fff' }}>
                Three yellow cards
              </h2>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4" style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
              <p>
                During the Croatia vs Australia group stage match, English referee{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Graham Poll</strong> made a historic error by issuing
                three yellow cards to Croatian defender{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Josip Šimunić</strong> before eventually sending him off.
              </p>
              <p>
                Šimunić received his first yellow in the <strong style={{ color: 'var(--text-primary)' }}>61st minute</strong> for fouling Harry Kewell.
                In the <strong style={{ color: 'var(--text-primary)' }}>90th minute</strong>, Poll booked him again for another foul — but failed to
                follow it with the mandatory red card that should have ended Šimunić&apos;s match.
              </p>
              <p>
                Then, in the <strong style={{ color: 'var(--text-primary)' }}>93rd minute</strong> — after Poll had already blown the final whistle —
                Šimunić approached the referee angrily and pushed him. Poll responded by issuing a
                third yellow card, and only then a red.
              </p>
              <p>
                Poll later explained he had &ldquo;incorrectly noted down a different player&apos;s name&rdquo; when
                booking Šimunić the second time. His assistants and fourth official all missed the
                error too. &ldquo;I was the referee, it was my error and the buck stops with me,&rdquo; Poll said,
                adding that officials felt &ldquo;disbelief&rdquo; when they discovered the mistake in the dressing room.
              </p>
              <p>
                Some observers speculated that Šimunić&apos;s Australian accent — despite his Croatian
                nationality — may have contributed to the confusion. Poll subsequently retired from
                international tournaments, citing the &ldquo;pain and agony&rdquo; the mistake caused him.
              </p>
            </div>

            <hr style={{ borderColor: 'var(--border)' }} />
            <div className="px-6 py-3">
              <a
                href="https://en.wikipedia.org/wiki/List_of_2006_FIFA_World_Cup_controversies#Three_yellow_cards"
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
