'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GROUPS_2026 } from '@/lib/groups';
import { getFlag } from '@/lib/flags';

const HOW_IT_WORKS = [
  {
    icon: '🖨️',
    title: 'Print tickets',
    body: 'Your organiser generates QR-coded tickets — one for each of the 48 teams — and prints them out.',
  },
  {
    icon: '🎲',
    title: 'The draw',
    body: 'Teams are randomly assigned. Hand out the tickets and let fate decide who gets Argentina.',
  },
  {
    icon: '📱',
    title: 'Claim your team',
    body: 'Scan the QR code on your ticket to put your name against your nation. Works on any phone, no app needed.',
  },
  {
    icon: '🏆',
    title: 'Follow & win',
    body: 'Track your team from the group stage to the final. Prizes for the winner, runner-up, and more novelty awards.',
  },
];

const FEATURES = [
  {
    icon: '📊',
    title: 'Updates automatically',
    body: 'Goals, group standings and knockout results sync live throughout the tournament. No spreadsheets, no manual work — check back any time and see exactly where your team stands.',
  },
  {
    icon: '🌍',
    title: '48 nations, 6 continents',
    body: "The biggest World Cup in history. South America's reigning champions, Europe's powerhouses, Africa's challengers, and hosts USA, Canada and Mexico — all in the hat.",
  },
  {
    icon: '🎯',
    title: 'Everyone stays in it',
    body: "It's not just about the winner. Novelty prizes for the team with the top scorer, the longest shot, and more — so even a group-stage exit keeps things interesting.",
  },
];

const STAT_ITEMS = [
  { num: '48', label: 'Nations' },
  { num: '12', label: 'Groups' },
  { num: '104', label: 'Matches' },
  { num: '3', label: 'Host Countries' },
];

function GroupCard({ letter, teams }: { letter: string; teams: string[] }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <p
        className="text-xs font-black uppercase tracking-widest mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Group {letter}
      </p>
      <ul className="space-y-1.5">
        {teams.map(team => (
          <li key={team} className="flex items-center gap-2">
            <span style={{ fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>{getFlag(team)}</span>
            <span
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {team}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CompanyGate({
  invalidCode = false,
  redirectPath = '/',
  marketing = false,
}: {
  invalidCode?: boolean;
  redirectPath?: string;
  marketing?: boolean;
}) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (invalidCode) {
      localStorage.removeItem('company_code');
      setError('Company code not recognised');
      setChecking(false);
      return;
    }
    const stored = localStorage.getItem('company_code');
    if (stored) {
      router.replace(`${redirectPath}?code=${stored}`);
    } else {
      setChecking(false);
    }
  }, [router, invalidCode, redirectPath]);

  async function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/company/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        localStorage.setItem('company_code', trimmed);
        router.replace(`${redirectPath}?code=${trimmed}`);
      } else {
        setError('Company code not recognised');
      }
    } catch {
      setError('Could not connect');
    }
    setLoading(false);
  }

  if (checking) return null;

  const formCard = (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.22)' }}
    >
      <div
        className="px-7 pt-6 pb-5"
        style={{
          backgroundImage: 'url(/wc2026-header-bg.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
          FIFA World Cup · 2026
        </p>
        <h2 className="album-title text-4xl font-black tracking-tight mt-1" style={{ color: '#fff', lineHeight: 1 }}>
          The Draw
        </h2>
        <p className="text-sm mt-1 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
          Office Sweepstake
        </p>
      </div>

      <div className="px-7 py-6" style={{ background: 'var(--card)' }}>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          Enter your company code to view the draw.
        </p>
        <input
          type="text"
          placeholder="e.g. ACME26"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus={!marketing}
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
            outline: 'none',
            textAlign: 'center',
            letterSpacing: '0.12em',
            fontWeight: 700,
          }}
        />
        {error && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full font-bold py-3 rounded-xl mt-3 transition-opacity"
          style={{ background: '#4D10C8', color: '#fff', opacity: loading ? 0.6 : 1, fontSize: '1rem' }}
        >
          {loading ? 'Checking…' : 'View the Draw →'}
        </button>
        <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
          No code yet?{' '}
          <a href="/setup" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
            Set up your own draw
          </a>
        </p>
      </div>
    </div>
  );

  // Simple gate (used on /manage)
  if (!marketing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm">{formCard}</div>
      </main>
    );
  }

  // Full marketing landing page
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Hero */}
      <div
        style={{
          backgroundImage: 'url(/wc2026-header-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(105deg, rgba(15,0,80,0.82) 0%, rgba(15,0,60,0.55) 55%, rgba(0,0,0,0.15) 100%)',
          }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 items-center">

              {/* Left: title */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  FIFA World Cup · USA · Canada · Mexico · 2026
                </p>
                <h1
                  className="album-title font-black tracking-tight"
                  style={{ color: '#fff', fontSize: 'clamp(3.5rem, 8vw, 6rem)', lineHeight: 0.9 }}
                >
                  The<br />Draw
                </h1>
                <p className="text-lg sm:text-xl font-bold mt-5" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  The office sweepstake,<br className="hidden sm:block" /> done right.
                </p>
                <p className="text-sm sm:text-base mt-3 max-w-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  48 teams. QR codes, live stats, and automatic prize tracking — from the group stage to the final on 19 July 2026.
                </p>
              </div>

              {/* Right: form */}
              <div>{formCard}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ background: '#4D10C8' }}>
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-4">
          {STAT_ITEMS.map((s, i) => (
            <div
              key={s.label}
              className="py-4 text-center"
              style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.15)' : undefined }}
            >
              <p className="text-2xl sm:text-3xl font-black" style={{ color: '#fff' }}>{s.num}</p>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 space-y-16">

        {/* How it works */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            How it works
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
            Up and running in minutes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl p-5"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="text-3xl mb-3">{step.icon}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="font-black flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      background: '#4D10C8',
                      color: '#fff',
                      width: '1.25rem',
                      height: '1.25rem',
                      fontSize: '0.65rem',
                    }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="rounded-xl p-6"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-black text-base mb-2" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Groups */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
            The groups
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Who&apos;s in the draw?
          </h2>
          <p className="text-sm mb-6 max-w-lg" style={{ color: 'var(--text-muted)' }}>
            All 48 nations confirmed for FIFA World Cup 2026 — 12 groups, with the top two from each progressing to the knockout rounds.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(GROUPS_2026).map(([letter, teams]) => (
              <GroupCard key={letter} letter={letter} teams={teams} />
            ))}
          </div>
        </section>

        {/* Footer CTA */}
        <section
          className="rounded-2xl p-8 sm:p-10 text-center"
          style={{
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div style={{ background: 'rgba(15,0,80,0.7)', borderRadius: '1rem', padding: '2rem' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Get started
            </p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-3" style={{ color: '#fff' }}>
              Running your own sweepstake?
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Set up The Draw for your office or group in under two minutes. Free, no account needed.
            </p>
            <a
              href="/setup"
              className="inline-block font-bold px-8 py-3 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: '#fff', color: '#4D10C8', fontSize: '1rem' }}
            >
              Set up your draw →
            </a>
          </div>
        </section>

      </div>
    </main>
  );
}
