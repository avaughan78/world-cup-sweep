'use client';

import { useState } from 'react';

async function parseResponse(res: Response): Promise<{ ok: boolean; data: unknown; raw: string }> {
  const raw = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(raw), raw };
  } catch {
    return { ok: false, data: null, raw: raw || `HTTP ${res.status}` };
  }
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [shotTeam, setShotTeam] = useState('');
  const [shotLabel, setShotLabel] = useState('');
  const [shotNotes, setShotNotes] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoginError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setLoginError('Wrong password');
      }
    } catch {
      setLoginError('Could not connect to server');
    }
    setLoading(false);
  }

  async function handleSync() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as Record<string, unknown> | null;
      setStatus({ ok, message: d ? JSON.stringify(d.results ?? d, null, 2) : raw });
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  async function handleReset() {
    if (!confirm('Clear all stats, scores, and prize overrides? This cannot be undone.')) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as Record<string, unknown> | null;
      setStatus({ ok: ok && !!d?.ok, message: (d?.message as string) ?? raw });
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  async function handleShotOverride() {
    if (!shotTeam.trim()) {
      setStatus({ ok: false, message: 'Team name is required' });
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          team_name: shotTeam,
          value_label: shotLabel,
          notes: shotNotes,
        }),
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as Record<string, unknown> | null;
      setStatus({ ok: ok && !!d?.ok, message: d?.ok ? 'Saved!' : raw });
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    padding: '0.625rem 0.875rem',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
  };

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div
          className="rounded-xl p-8 w-full max-w-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            Office Sweepstake
          </p>
          <h1 className="text-3xl font-black tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
            Admin
          </h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setLoginError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inputStyle}
          />
          {loginError && (
            <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{loginError}</p>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full font-bold py-2.5 rounded-lg mt-4 transition-opacity"
            style={{ background: 'var(--text-primary)', color: 'var(--bg)', opacity: loading ? 0.5 : 1, fontSize: '1rem' }}
          >
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-2xl mx-auto px-6">

        <header className="pt-10 pb-0">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Office Sweepstake
          </p>
          <div className="flex items-baseline justify-between mt-1.5">
            <h1 className="text-5xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Admin
            </h1>
            <a href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Back to site</a>
          </div>
          <hr className="mt-5" style={{ borderColor: 'var(--separator)' }} />
        </header>

        <div className="py-10 space-y-8">

          {/* Sync */}
          <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Sync Data</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Pulls from Google Sheets (names) + football-data.org (live stats) and saves to the database.
            </p>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleSync}
                disabled={loading}
                className="font-bold px-6 py-2.5 rounded-lg transition-opacity"
                style={{ background: 'var(--text-primary)', color: 'var(--bg)', opacity: loading ? 0.5 : 1, fontSize: '1rem' }}
              >
                {loading ? 'Syncing…' : 'Sync Now'}
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="font-bold px-6 py-2.5 rounded-lg transition-opacity"
                style={{ background: '#fee2e2', color: '#991b1b', opacity: loading ? 0.5 : 1, fontSize: '1rem' }}
              >
                {loading ? 'Resetting…' : 'Reset for 2026'}
              </button>
            </div>
          </div>

          {/* Longest shot override */}
          <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Longest Range Shot</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Manually set the current record holder. Team name must match the spreadsheet exactly.
            </p>
            <div className="space-y-3">
              <input
                placeholder="Team name (e.g. Brazil)"
                value={shotTeam}
                onChange={e => setShotTeam(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Label (e.g. 38.2m — Rüdiger vs USA)"
                value={shotLabel}
                onChange={e => setShotLabel(e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Notes (optional)"
                value={shotNotes}
                onChange={e => setShotNotes(e.target.value)}
                style={inputStyle}
              />
              <button
                onClick={handleShotOverride}
                disabled={loading}
                className="font-bold px-6 py-2.5 rounded-lg transition-opacity"
                style={{ background: 'var(--green)', color: '#fff', opacity: loading ? 0.5 : 1, fontSize: '1rem' }}
              >
                {loading ? 'Saving…' : 'Save Shot Override'}
              </button>
            </div>
          </div>

          {/* Status */}
          {status && (
            <div
              className="rounded-xl p-4 text-sm font-mono whitespace-pre-wrap overflow-auto"
              style={{
                background: status.ok ? '#f0fdf4' : '#fef2f2',
                border: `1px solid ${status.ok ? '#bbf7d0' : '#fecaca'}`,
                color: status.ok ? '#166534' : '#991b1b',
              }}
            >
              {status.message}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
