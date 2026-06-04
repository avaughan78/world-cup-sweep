'use client';

import { useState, useEffect, use } from 'react';
import { getFlag } from '@/lib/flags';

export default function ClaimPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [name, setName] = useState('');
  const [team, setTeam] = useState<string | null>(null);
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [existing, setExisting] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/claim/resolve?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then((d: { team?: string; name?: string; error?: string; company_code?: string }) => {
        if (d.error) setError(d.error);
        else {
          setTeam(d.team ?? null);
          setExisting(d.name ?? null);
          if (d.company_code) {
            setCompanyCode(d.company_code);
            localStorage.setItem('company_code', d.company_code);
          }
        }
      })
      .catch(() => setError('Could not load ticket.'));
  }, [token]);

  async function handleClaim() {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name }),
      });
      const d = await res.json() as { ok?: boolean; error?: string; company_code?: string };
      if (d.ok) {
        if (d.company_code) {
          setCompanyCode(d.company_code);
          localStorage.setItem('company_code', d.company_code);
        }
        setDone(true);
      }
      else setError(d.error ?? 'Something went wrong.');
    } catch {
      setError('Could not connect.');
    }
    setLoading(false);
  }

  const flag = team ? getFlag(team) : null;

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{flag}</div>
          <h1 className="text-4xl font-black tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            You&apos;ve got {team}!
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-muted)' }}>Good luck, {name.trim()}.</p>
          <a
            href={companyCode ? `/?code=${companyCode}` : '/'}
            className="inline-block mt-8 font-bold px-6 py-3 rounded-xl"
            style={{ background: 'var(--green)', color: '#fff', fontSize: '1rem' }}
          >
            View the sweep →
          </a>
        </div>
      </main>
    );
  }

  if (error && !team) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <p style={{ color: '#ef4444' }}>{error}</p>
      </main>
    );
  }

  if (!team) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="text-4xl animate-spin" style={{ animationDuration: '1.2s' }}>⚽</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div style={{ fontSize: '5rem', lineHeight: 1, marginBottom: '1rem' }}>{flag}</div>
        <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          {team}
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {existing
            ? `Currently claimed by ${existing} — you can update it below.`
            : 'Enter your name to claim this team.'}
        </p>

        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleClaim()}
          autoFocus
          style={{
            width: '100%',
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            color: 'var(--text-primary)',
            fontSize: '1.1rem',
            outline: 'none',
            textAlign: 'center',
          }}
        />
        {error && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        <button
          onClick={handleClaim}
          disabled={loading}
          className="w-full font-bold py-3 rounded-xl mt-4 transition-opacity"
          style={{ background: 'var(--green)', color: '#fff', opacity: loading ? 0.5 : 1, fontSize: '1.1rem' }}
        >
          {loading ? 'Saving…' : existing ? 'Update Claim' : 'Claim This Team'}
        </button>
      </div>
    </main>
  );
}
