'use client';

import { useState, useEffect } from 'react';
import { GROUPS_2026 } from '@/lib/groups';
import { getFlag } from '@/lib/flags';
import ThemeToggle from '@/components/ThemeToggle';

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
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-dismiss status toast after 6 seconds
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(t);
  }, [status]);

  // Participants state
  const [names, setNames] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({}); // committed values
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

  // Longest shot state
  const [shotTeam, setShotTeam] = useState('');
  const [shotLabel, setShotLabel] = useState('');
  const [shotNotes, setShotNotes] = useState('');

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

  // Load participants after auth
  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then(r => r.json())
      .then((d: { participants?: Array<{ team_name: string; participant_name: string | null }> }) => {
        const map: Record<string, string> = {};
        for (const p of d.participants ?? []) {
          map[p.team_name] = p.participant_name ?? '';
        }
        setNames(map);
        setSaved(map);
      })
      .catch(() => {});
  }, [authed, password]);

  async function saveName(team: string) {
    const value = names[team] ?? '';
    if (value === (saved[team] ?? '')) return; // no change
    setSaving(prev => new Set(prev).add(team));
    try {
      await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, team_name: team, participant_name: value }),
      });
      setSaved(prev => ({ ...prev, [team]: value }));
      setJustSaved(prev => { const n = new Set(prev); n.add(team); return n; });
      setTimeout(() => setJustSaved(prev => { const n = new Set(prev); n.delete(team); return n; }), 1500);
    } catch { /* silent */ }
    setSaving(prev => { const n = new Set(prev); n.delete(team); return n; });
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

  async function handleGenerateTokens() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/generate-tokens', {
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
    if (!shotTeam.trim()) { setStatus({ ok: false, message: 'Team name is required' }); return; }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, team_name: shotTeam, value_label: shotLabel, notes: shotNotes }),
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
        <div className="rounded-xl p-8 w-full max-w-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
            Office Sweepstake
          </p>
          <h1 className="text-3xl font-black tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>Admin</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setLoginError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inputStyle}
          />
          {loginError && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{loginError}</p>}
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
      {/* Fixed toast notification */}
      {status && (
        <div
          className="fixed top-4 left-4 right-4 sm:left-auto sm:max-w-sm z-50 rounded-xl px-4 py-3 text-sm shadow-xl flex items-start gap-3"
          style={{
            background: status.ok ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${status.ok ? '#bbf7d0' : '#fecaca'}`,
            color: status.ok ? '#166534' : '#991b1b',
          }}
        >
          <span className="text-base leading-none mt-0.5">{status.ok ? '✓' : '✗'}</span>
          <span className="font-mono whitespace-pre-wrap flex-1" style={{ fontSize: '0.8rem' }}>{status.message}</span>
          <button onClick={() => setStatus(null)} style={{ opacity: 0.5, fontSize: '1rem', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6">

        <header className="pt-10 pb-0">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Office Sweepstake
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Admin</h1>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <a href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Back to site</a>
            </div>
          </div>
          <hr className="mt-5" style={{ borderColor: 'var(--separator)' }} />
        </header>

        <div className="py-10 space-y-8">

          {/* Actions */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSync}
                disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity"
                style={{ background: 'var(--text-primary)', color: 'var(--bg)', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
              >
                {loading ? 'Working…' : 'Sync Now'}
              </button>
              <button
                onClick={handleReset}
                disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity"
                style={{ background: '#fee2e2', color: '#991b1b', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
              >
                Reset for 2026
              </button>
              <button
                onClick={handleGenerateTokens}
                disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity"
                style={{ background: 'var(--text-primary)', color: 'var(--bg)', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
              >
                Generate Tokens
              </button>
              <a
                href="/print"
                target="_blank"
                className="font-bold px-5 py-2 rounded-lg"
                style={{ background: 'var(--green)', color: '#fff', fontSize: '0.9rem' }}
              >
                Print Tickets ↗
              </a>
            </div>

            {/* Longest shot override */}
            <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Longest Shot Override</p>
              <input
                placeholder="Team"
                value={shotTeam}
                onChange={e => setShotTeam(e.target.value)}
                style={{ flex: '1 1 130px', minWidth: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
              />
              <input
                placeholder="Label (e.g. 38.2m — Rüdiger)"
                value={shotLabel}
                onChange={e => setShotLabel(e.target.value)}
                style={{ flex: '2 1 180px', minWidth: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
              />
              <input
                placeholder="Notes"
                value={shotNotes}
                onChange={e => setShotNotes(e.target.value)}
                style={{ flex: '1 1 100px', minWidth: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none' }}
              />
              <button
                onClick={handleShotOverride}
                disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity flex-shrink-0"
                style={{ background: 'var(--green)', color: '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
              >
                Save
              </button>
            </div>
          </div>

          {/* Participants */}
          <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Participants</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Edit names directly — changes save automatically on blur.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(GROUPS_2026).map(([letter, teams]) => (
                <div key={letter} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                  <div
                    className="px-3 py-2 font-black uppercase tracking-widest"
                    style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)' }}
                  >
                    Group {letter}
                  </div>
                  {teams.map(team => (
                    <div
                      key={team}
                      className="flex items-center gap-2 px-3 py-2"
                      style={{ borderBottom: `1px solid var(--border)` }}
                    >
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{getFlag(team)}</span>
                      <span className="font-semibold" style={{ fontSize: '0.8rem', color: 'var(--text-primary)', flexShrink: 0, width: '5.5rem' }}>
                        {team}
                      </span>
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          placeholder="No one yet"
                          value={names[team] ?? ''}
                          onChange={e => setNames(prev => ({ ...prev, [team]: e.target.value }))}
                          onBlur={() => saveName(team)}
                          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: `1px solid ${(names[team] ?? '') !== (saved[team] ?? '') ? 'var(--green)' : 'var(--border)'}`,
                            padding: '0.2rem 0.1rem',
                            color: 'var(--text-primary)',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                        {saving.has(team) && (
                          <span style={{ position: 'absolute', right: 0, top: '0.15rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>…</span>
                        )}
                        {justSaved.has(team) && !saving.has(team) && (
                          <span style={{ position: 'absolute', right: 0, top: '0.15rem', fontSize: '0.7rem', color: 'var(--green)' }}>✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
