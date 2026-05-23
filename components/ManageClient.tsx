'use client';

import { useState, useEffect } from 'react';
import type { Company } from '@/lib/db';
import { GROUPS_2026 } from '@/lib/groups';
import { getFlag } from '@/lib/flags';

export default function ManageClient({ company: initialCompany }: { company: Company }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sessionPw, setSessionPw] = useState('');
  const [inputPw, setInputPw] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [company, setCompany] = useState(initialCompany);

  const [names, setNames] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

  const [ticketPrice, setTicketPrice] = useState('');
  const [priceSaved, setPriceSaved] = useState(false);
  const [companyName, setCompanyName] = useState(initialCompany.name);
  const [nameSaved, setNameSaved] = useState(false);
  const [shotTeam, setShotTeam] = useState('');
  const [shotLabel, setShotLabel] = useState('');
  const [shotNotes, setShotNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const STORAGE_KEY = `manage_pw_${initialCompany.code}`;

  async function loadParticipants(pw: string) {
    const res = await fetch('/api/company/manage/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: initialCompany.code, password: pw }),
    });
    const data = await res.json() as { participants?: Array<{ team_name: string; participant_name: string | null }> };
    const map: Record<string, string> = {};
    for (const p of data.participants ?? []) map[p.team_name] = p.participant_name ?? '';
    setNames(map);
    setSaved(map);
  }

  async function doAuth(pw: string): Promise<boolean> {
    const res = await fetch('/api/company/manage/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: initialCompany.code, password: pw }),
    });
    const data = await res.json() as { ok: boolean; error?: string; company?: Company };
    if (data.ok && data.company) {
      setSessionPw(pw);
      setCompany(data.company);
      setTicketPrice(data.company.ticket_price != null ? String(data.company.ticket_price) : '');
      setAuthenticated(true);
      await loadParticipants(pw);
      return true;
    }
    return false;
  }

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      doAuth(stored).then(ok => {
        if (!ok) localStorage.removeItem(STORAGE_KEY);
        setChecking(false);
      });
    } else {
      setChecking(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(t);
  }, [status]);

  async function handleLogin() {
    const pw = inputPw.trim();
    if (!pw) return;
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/company/manage/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: initialCompany.code, password: pw }),
      });
      const data = await res.json() as { ok: boolean; error?: string; company?: Company };
      if (data.ok && data.company) {
        localStorage.setItem(STORAGE_KEY, pw);
        setSessionPw(pw);
        setCompany(data.company);
        setTicketPrice(data.company.ticket_price != null ? String(data.company.ticket_price) : '');
        setAuthenticated(true);
        await loadParticipants(pw);
      } else {
        setAuthError(data.error ?? 'Incorrect password');
      }
    } catch {
      setAuthError('Could not connect');
    }
    setAuthLoading(false);
  }

  async function saveName(team: string) {
    const value = names[team] ?? '';
    if (value === (saved[team] ?? '')) return;
    setSaving(prev => new Set(prev).add(team));
    try {
      await fetch('/api/company/manage/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: initialCompany.code, password: sessionPw, team_name: team, participant_name: value }),
      });
      setSaved(prev => ({ ...prev, [team]: value }));
      setJustSaved(prev => { const n = new Set(prev); n.add(team); return n; });
      setTimeout(() => setJustSaved(prev => { const n = new Set(prev); n.delete(team); return n; }), 1500);
    } catch { /* silent */ }
    setSaving(prev => { const n = new Set(prev); n.delete(team); return n; });
  }

  async function handleGenerateTokens() {
    setLoading(true);
    try {
      const res = await fetch('/api/company/manage/generate-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: initialCompany.code, password: sessionPw }),
      });
      const data = await res.json() as { ok: boolean; message?: string };
      setStatus({ ok: !!data.ok, message: data.message ?? 'Done' });
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
    setLoading(false);
  }

  async function handleSaveTicketPrice() {
    const price = parseFloat(ticketPrice);
    setLoading(true);
    try {
      const res = await fetch('/api/company/manage/ticket-price', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: initialCompany.code, password: sessionPw, ticket_price: isNaN(price) ? null : price }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        setCompany(prev => ({ ...prev, ticket_price: isNaN(price) ? null : price }));
        setPriceSaved(true);
        setTimeout(() => setPriceSaved(false), 2000);
      }
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
    setLoading(false);
  }

  async function handleSaveName() {
    const name = companyName.trim();
    if (!name || name === company.name) return;
    setLoading(true);
    try {
      const res = await fetch('/api/company/manage/details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: initialCompany.code, password: sessionPw, name }),
      });
      const data = await res.json() as { ok: boolean; company?: Company };
      if (data.ok && data.company) {
        setCompany(data.company);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      }
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
    setLoading(false);
  }

  async function handleShotOverride() {
    if (!shotTeam.trim()) { setStatus({ ok: false, message: 'Team name required' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/company/manage/shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: initialCompany.code, password: sessionPw, team_name: shotTeam, value_label: shotLabel, notes: shotNotes }),
      });
      const data = await res.json() as { ok: boolean };
      setStatus({ ok: !!data.ok, message: data.ok ? 'Saved!' : 'Failed' });
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
    setLoading(false);
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(`${window.location.origin}/?code=${company.code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const smallInputStyle: React.CSSProperties = {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none',
  };

  if (checking) return null;

  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
          <div className="px-7 pt-7 pb-6" style={{
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
              FIFA World Cup · 2026 · {company.name}
            </p>
            <h1 className="album-title text-5xl font-black tracking-tight mt-1" style={{ color: '#fff', lineHeight: 1 }}>
              The Draw
            </h1>
            <p className="text-sm mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Organiser Admin
            </p>
          </div>
          <div className="px-7 py-6" style={{ background: 'var(--card)' }}>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Enter your admin password to manage this draw.
            </p>
            <input
              type="password"
              placeholder="Admin password"
              value={inputPw}
              onChange={e => { setInputPw(e.target.value); setAuthError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              autoFocus
              style={{
                width: '100%',
                background: 'var(--bg)', border: `1px solid ${authError ? '#ef4444' : 'var(--border)'}`,
                borderRadius: '0.5rem', padding: '0.75rem 1rem',
                color: 'var(--text-primary)', fontSize: '1rem', outline: 'none',
              }}
            />
            {authError && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{authError}</p>}
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="w-full font-bold py-3 rounded-xl mt-3 transition-opacity"
              style={{ background: '#4D10C8', color: '#fff', opacity: authLoading ? 0.6 : 1, fontSize: '1rem' }}
            >
              {authLoading ? 'Checking…' : 'Access Admin →'}
            </button>
            <p className="text-xs mt-4 text-center">
              <a href={`/?code=${company.code}`} style={{ color: 'var(--text-muted)' }}>← Back to draw</a>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {status && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-xl px-4 py-3 text-sm shadow-xl flex items-start gap-3"
          style={{ background: status.ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${status.ok ? '#bbf7d0' : '#fecaca'}`, color: status.ok ? '#166534' : '#991b1b' }}>
          <span className="text-base leading-none mt-0.5">{status.ok ? '✓' : '✗'}</span>
          <span className="flex-1">{status.message}</span>
          <button onClick={() => setStatus(null)} style={{ opacity: 0.5, fontSize: '1rem', lineHeight: 1 }}>✕</button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <header className="pt-10 pb-0">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            FIFA World Cup 2026
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
                {company.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>Organiser Admin</p>
            </div>
            <a href={`/?code=${company.code}`} className="text-sm" style={{ color: 'var(--text-muted)' }}>← Back to draw</a>
          </div>
          <hr className="mt-5" style={{ borderColor: 'var(--separator)' }} />
        </header>

        <div className="py-10 space-y-8">

          {/* Actions + settings */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Actions</p>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleGenerateTokens} disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity"
                style={{ background: 'var(--text-primary)', color: 'var(--bg)', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}>
                {loading ? 'Working…' : 'Generate Tokens'}
              </button>
              <a href={`/print?code=${company.code}`} target="_blank"
                className="font-bold px-5 py-2 rounded-lg"
                style={{ background: 'var(--green)', color: '#fff', fontSize: '0.9rem' }}>
                Print Tickets ↗
              </a>
              <a href={`/?code=${company.code}`} target="_blank"
                className="font-bold px-5 py-2 rounded-lg"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: '0.9rem' }}>
                View Draw ↗
              </a>
              <button onClick={handleCopyLink}
                className="font-bold px-5 py-2 rounded-lg transition-colors"
                style={{ background: copied ? '#f0fdf4' : 'var(--bg)', color: copied ? '#166534' : 'var(--text-muted)', border: `1px solid ${copied ? '#bbf7d0' : 'var(--border)'}`, fontSize: '0.9rem' }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>

            {/* Company name */}
            <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Company Name</p>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                style={{ flex: '1 1 180px', minWidth: 0, ...smallInputStyle }} />
              <button onClick={handleSaveName} disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                style={{ background: nameSaved ? '#f0fdf4' : 'var(--green)', color: nameSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}>
                {nameSaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>

            {/* Ticket price */}
            <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Ticket Price</p>
              <div className="flex items-center gap-1 flex-shrink-0"
                style={{ ...smallInputStyle, padding: '0.5rem 0.75rem', width: 'auto' }}>
                <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>£</span>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={ticketPrice}
                  onChange={e => setTicketPrice(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTicketPrice()}
                  style={{ background: 'transparent', border: 'none', outline: 'none', width: '5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }} />
              </div>
              <button onClick={handleSaveTicketPrice} disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                style={{ background: priceSaved ? '#f0fdf4' : 'var(--green)', color: priceSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}>
                {priceSaved ? 'Saved ✓' : 'Save'}
              </button>
              <p className="w-full text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Sets prize amounts shown on the draw page (48 tickets × price × split).
              </p>
            </div>

            {/* Longest shot */}
            <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Longest Shot Override</p>
              <input placeholder="Team" value={shotTeam} onChange={e => setShotTeam(e.target.value)}
                style={{ flex: '1 1 130px', minWidth: 0, ...smallInputStyle }} />
              <input placeholder="Label (e.g. 38.2m — Rüdiger)" value={shotLabel} onChange={e => setShotLabel(e.target.value)}
                style={{ flex: '2 1 180px', minWidth: 0, ...smallInputStyle }} />
              <input placeholder="Notes" value={shotNotes} onChange={e => setShotNotes(e.target.value)}
                style={{ flex: '1 1 100px', minWidth: 0, ...smallInputStyle }} />
              <button onClick={handleShotOverride} disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity flex-shrink-0"
                style={{ background: 'var(--green)', color: '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}>
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
                  <div className="px-3 py-2 font-black uppercase tracking-widest"
                    style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Group {letter}
                  </div>
                  {teams.map(team => (
                    <div key={team} className="flex items-center gap-2 px-3 py-2"
                      style={{ borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{getFlag(team)}</span>
                      <span className="font-semibold"
                        style={{ fontSize: '0.8rem', color: 'var(--text-primary)', flexShrink: 0, width: '5.5rem' }}>
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
                            width: '100%', background: 'transparent', border: 'none',
                            borderBottom: `1px solid ${(names[team] ?? '') !== (saved[team] ?? '') ? 'var(--green)' : 'var(--border)'}`,
                            padding: '0.2rem 0.1rem', color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
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
