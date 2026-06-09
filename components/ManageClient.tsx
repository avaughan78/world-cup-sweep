'use client';

import { useState, useEffect } from 'react';
import type { Company } from '@/lib/db';
import PasswordInput from './PasswordInput';
import { GROUPS_2026 } from '@/lib/groups';
import Flag from '@/components/Flag';
import ThemeToggle from '@/components/ThemeToggle';

export default function ManageClient({ company: initialCompany }: { company: Company }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [inputPw, setInputPw] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [company, setCompany] = useState(initialCompany);

  const [names, setNames] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());
  const [paid, setPaid] = useState<Record<string, boolean>>({});

  const [ticketPrice, setTicketPrice] = useState(initialCompany.ticket_price != null ? String(initialCompany.ticket_price) : '');
  const [priceSaved, setPriceSaved] = useState(false);
  const [companyName, setCompanyName] = useState(initialCompany.name);
  const [nameSaved, setNameSaved] = useState(false);
  const [adminEmail, setAdminEmail] = useState(initialCompany.admin_email ?? '');
  const [emailSaved, setEmailSaved] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [hiddenPrizes, setHiddenPrizes] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadParticipants() {
    const res = await fetch('/api/company/manage/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json() as { participants?: Array<{ team_name: string; participant_name: string | null; paid: boolean }> };
    const nameMap: Record<string, string> = {};
    const paidMap: Record<string, boolean> = {};
    for (const p of data.participants ?? []) {
      nameMap[p.team_name] = p.participant_name ?? '';
      paidMap[p.team_name] = p.paid;
    }
    setNames(nameMap);
    setSaved(nameMap);
    setPaid(paidMap);
  }

  async function loadPrizeOverrides() {
    const res = await fetch('/api/company/manage/prize-overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json() as { overrides?: Array<{ category: string; team_name: string | null }> };
    const hidden = new Set<string>();
    for (const o of data.overrides ?? []) {
      if (o.team_name === '__hidden__') hidden.add(o.category);
    }
    setHiddenPrizes(hidden);
  }

  async function handleTogglePrize(slug: string, hide: boolean) {
    setLoading(true);
    try {
      const res = await fetch('/api/company/manage/prize-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, hidden: hide }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        setHiddenPrizes(prev => {
          const next = new Set(prev);
          hide ? next.add(slug) : next.delete(slug);
          return next;
        });
      }
    } catch { /* silent */ }
    setLoading(false);
  }

  async function doAuth(pw: string): Promise<boolean> {
    const res = await fetch('/api/company/manage/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: initialCompany.code, password: pw }),
    });
    const data = await res.json() as { ok: boolean; error?: string; company?: Company };
    if (data.ok && data.company) {
      setCompany(data.company);
      setTicketPrice(data.company.ticket_price != null ? String(data.company.ticket_price) : '');
      setAuthenticated(true);
      await Promise.all([loadParticipants(), loadPrizeOverrides()]);
      return true;
    }
    return false;
  }

  useEffect(() => {
    // Try to restore session via HttpOnly cookie — validate the session belongs to this company
    fetch('/api/company/manage/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).then(async r => {
      if (r.ok) {
        const data = await r.json() as { companyId?: number; participants?: Array<{ team_name: string; participant_name: string | null; paid: boolean }> };
        if (data.companyId !== initialCompany.id) {
          // Session belongs to a different company — require fresh login
          setChecking(false);
          return;
        }
        const nameMap: Record<string, string> = {};
        const paidMap: Record<string, boolean> = {};
        for (const p of data.participants ?? []) {
          nameMap[p.team_name] = p.participant_name ?? '';
          paidMap[p.team_name] = p.paid;
        }
        setNames(nameMap);
        setSaved(nameMap);
        setPaid(paidMap);
        await loadPrizeOverrides();
        setAuthenticated(true);
      }
      setChecking(false);
    }).catch(() => setChecking(false));
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
        setCompany(data.company);
        setTicketPrice(data.company.ticket_price != null ? String(data.company.ticket_price) : '');
        setAuthenticated(true);
        await Promise.all([loadParticipants(), loadPrizeOverrides()]);
      } else {
        setAuthError(data.error ?? 'Incorrect password');
      }
    } catch {
      setAuthError('Could not connect');
    }
    setAuthLoading(false);
  }

  async function togglePaid(team: string) {
    const newValue = !paid[team];
    setPaid(prev => ({ ...prev, [team]: newValue }));
    try {
      await fetch('/api/company/manage/paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: team, paid: newValue }),
      });
    } catch {
      setPaid(prev => ({ ...prev, [team]: !newValue }));
    }
  }

  async function saveName(team: string) {
    const value = names[team] ?? '';
    if (value === (saved[team] ?? '')) return;
    setSaving(prev => new Set(prev).add(team));
    try {
      await fetch('/api/company/manage/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: team, participant_name: value }),
      });
      setSaved(prev => ({ ...prev, [team]: value }));
      setJustSaved(prev => { const n = new Set(prev); n.add(team); return n; });
      setTimeout(() => setJustSaved(prev => { const n = new Set(prev); n.delete(team); return n; }), 1500);
    } catch { /* silent */ }
    setSaving(prev => { const n = new Set(prev); n.delete(team); return n; });
  }

  async function handleGenerateTokens() {
    if (!confirm('Regenerate QR codes? This will invalidate any tickets that have already been printed — you\'ll need to reprint before the draw.')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/company/manage/generate-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
        body: JSON.stringify({ ticket_price: isNaN(price) ? null : price }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (res.ok && data.ok) {
        setCompany(prev => ({ ...prev, ticket_price: isNaN(price) ? null : price }));
        setPriceSaved(true);
        setTimeout(() => setPriceSaved(false), 2000);
      } else {
        setStatus({ ok: false, message: data.error ?? `Failed to save price (${res.status}) — try logging out and back in` });
      }
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
    setLoading(false);
  }

  async function handleLogout() {
    await fetch('/api/company/manage/logout', { method: 'POST' });
    window.location.href = `/?code=${company.code}`;
  }

  async function handleSavePassword() {
    const trimmed = newPw.trim();
    if (!trimmed) { setPwError('Password cannot be empty'); return; }
    if (trimmed !== confirmPw.trim()) { setPwError('Passwords do not match'); return; }
    setLoading(true);
    setPwError('');
    try {
      const res = await fetch('/api/company/manage/details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: trimmed }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        setNewPw('');
        setConfirmPw('');
        setPwSaved(true);
        setTimeout(() => setPwSaved(false), 2000);
      } else {
        setPwError(data.error ?? 'Failed to save');
      }
    } catch { setPwError('Could not connect'); }
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
        body: JSON.stringify({ name }),
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


  async function handleSaveEmail() {
    const email = adminEmail.trim();
    if (email === (company.admin_email ?? '')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/company/manage/details', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_email: email || null }),
      });
      const data = await res.json() as { ok: boolean };
      if (data.ok) {
        setCompany(prev => ({ ...prev, admin_email: email || null }));
        setEmailSaved(true);
        setTimeout(() => setEmailSaved(false), 2000);
      }
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
              WC26 Sweep
            </h1>
            <p className="text-sm mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Organiser Admin
            </p>
          </div>
          <div className="px-7 py-6" style={{ background: 'var(--card)' }}>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
              Enter your admin password to manage this draw.
            </p>
            <PasswordInput
              value={inputPw}
              onChange={v => { setInputPw(v); setAuthError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Admin password"
              autoFocus
              inputStyle={{
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
            <div className="flex items-center justify-between text-xs mt-4">
              <a href={`/?code=${company.code}`} style={{ color: 'var(--text-muted)' }}>← Back to draw</a>
              <a href={`/manage/reset?code=${company.code}`} style={{ color: 'var(--text-muted)' }}>Forgot password?</a>
            </div>
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <header
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          <div className="px-6 sm:px-8 pt-5 pb-5">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
              FIFA World Cup · 2026 · {company.name}
            </p>
            <div className="flex items-end justify-between mt-1.5">
              <div>
                <h1 className="album-title text-4xl sm:text-6xl font-black tracking-tight" style={{ color: '#fff' }}>
                  WC26 Sweep
                </h1>
                <p className="text-sm mt-1 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>Organiser Admin · {company.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <ThemeToggle />
                <a href={`/?code=${company.code}`} className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>← Sweep</a>
                <button type="button" onClick={handleLogout} className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Log out</button>
              </div>
            </div>
          </div>
        </header>

        <div className="py-8 space-y-8">

          {/* Workflow — numbered step cards */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Setup steps</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

              {/* Step 1 — always enabled */}
              <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full font-black text-xs flex-shrink-0"
                    style={{ background: '#4D10C8', color: '#fff', lineHeight: 1 }}>1</span>
                  <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Set ticket price</h3>
                </div>
                <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>
                  Used to calculate prize amounts on the sweep page.
                </p>
                <div className="flex items-center justify-center mt-1">
                  <div className="flex items-center gap-1"
                    style={{ ...smallInputStyle, padding: '0.5rem 0.75rem', width: 'auto' }}>
                    <span style={{ color: 'var(--text-muted)', userSelect: 'none', fontSize: '1rem' }}>£</span>
                    <input type="number" min="0" max="999" step="0.01" placeholder="0.00" value={ticketPrice}
                      onChange={e => { const v = parseFloat(e.target.value); setTicketPrice(v > 999 ? '999' : e.target.value); }}
                      onKeyDown={e => e.key === 'Enter' && handleSaveTicketPrice()}
                      style={{ background: 'transparent', border: 'none', outline: 'none', width: '4rem', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, textAlign: 'center' }} />
                  </div>
                </div>
                <button onClick={handleSaveTicketPrice} disabled={loading}
                  className="font-bold px-4 py-2 rounded-lg text-sm transition-colors w-full mt-1"
                  style={{ background: priceSaved ? '#f0fdf4' : 'var(--green)', color: priceSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1 }}>
                  {priceSaved ? 'Saved ✓' : 'Set price'}
                </button>
              </div>

              {/* Step 2 — always enabled (QR codes auto-generated) */}
              <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full font-black text-xs flex-shrink-0"
                    style={{ background: '#4D10C8', color: '#fff', lineHeight: 1 }}>2</span>
                  <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Print tickets</h3>
                </div>
                <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>
                  QR codes are generated automatically — just print, cut, fold, and draw from the hat.
                </p>
                <a href={`/print?code=${company.code}`} target="_blank"
                  className="font-bold px-4 py-2 rounded-lg text-sm text-center mt-1"
                  style={{ background: '#D40100', color: '#fff', display: 'block' }}>
                  Print tickets ↗
                </a>
              </div>

              {/* Step 3 — enabled when price is set (advert shows prize pot) */}
              {(() => {
                const priceSet = company.ticket_price != null;
                return (
                  <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)', opacity: priceSet ? 1 : 0.45, pointerEvents: priceSet ? 'auto' : 'none' }}>
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full font-black text-xs flex-shrink-0"
                        style={{ background: priceSet ? '#4D10C8' : 'var(--text-muted)', color: '#fff', lineHeight: 1 }}>3</span>
                      <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Print advert</h3>
                    </div>
                    <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>
                      An A4 poster with the sweep details and a QR code so latecomers can find the page.
                    </p>
                    <a href={`/advert?code=${company.code}`} target="_blank"
                      className="font-bold px-4 py-2 rounded-lg text-sm text-center mt-1"
                      style={{ background: '#D40100', color: '#fff', display: 'block' }}>
                      Print advert ↗
                    </a>
                  </div>
                );
              })()}

              {/* Step 4 — always enabled */}
              <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full font-black text-xs flex-shrink-0"
                    style={{ background: '#4D10C8', color: '#fff', lineHeight: 1 }}>4</span>
                  <h3 className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>Share the sweep</h3>
                </div>
                <p className="text-xs leading-relaxed flex-1" style={{ color: 'var(--text-muted)' }}>
                  Send everyone the link so they can follow live standings and results.
                </p>
                <div className="flex flex-col gap-2 mt-1">
                  <button onClick={handleCopyLink}
                    className="font-bold px-4 py-2 rounded-lg text-sm transition-colors w-full"
                    style={{ background: copied ? 'var(--green)' : '#4D10C8', color: '#fff' }}>
                    {copied ? 'Copied! ✓' : 'Copy link'}
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Settings */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Settings</p>

            {/* Company name */}
            <div className="flex flex-wrap gap-2 items-end mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Group name</p>
              <input value={companyName} onChange={e => setCompanyName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                maxLength={60}
                style={{ flex: '1 1 180px', minWidth: 0, ...smallInputStyle }} />
              <button onClick={handleSaveName} disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                style={{ background: nameSaved ? '#f0fdf4' : 'var(--green)', color: nameSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}>
                {nameSaved ? 'Saved ✓' : 'Save'}
              </button>
            </div>

            {/* Recovery email */}
            <div className="flex flex-wrap gap-2 items-end mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Recovery email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— for password resets</span></p>
              <input
                type="email"
                placeholder="you@example.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveEmail()}
                style={{ flex: '1 1 200px', minWidth: 0, ...smallInputStyle }}
              />
              <button onClick={handleSaveEmail} disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                style={{ background: emailSaved ? '#f0fdf4' : 'var(--green)', color: emailSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}>
                {emailSaved ? 'Saved ✓' : 'Save'}
              </button>
              <p className="w-full text-xs mt-0.5" style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                Optional. Only used if you ever need to reset your password via email.
              </p>
            </div>

            {/* Change password */}
            <div className="flex flex-wrap gap-2 items-end mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Change password</p>
              <PasswordInput
                value={newPw}
                onChange={v => { setNewPw(v); setPwError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSavePassword()}
                placeholder="New password"
                wrapperStyle={{ flex: '1 1 160px', minWidth: 0 }}
                inputStyle={smallInputStyle}
              />
              <PasswordInput
                value={confirmPw}
                onChange={v => { setConfirmPw(v); setPwError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleSavePassword()}
                placeholder="Confirm password"
                wrapperStyle={{ flex: '1 1 160px', minWidth: 0 }}
                inputStyle={smallInputStyle}
              />
              <button onClick={handleSavePassword} disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                style={{ background: pwSaved ? '#f0fdf4' : 'var(--green)', color: pwSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}>
                {pwSaved ? 'Saved ✓' : 'Change'}
              </button>
              {pwError && <p className="w-full text-xs mt-1" style={{ color: '#ef4444' }}>{pwError}</p>}
            </div>

            {/* Regenerate QR codes */}
            <div className="flex flex-wrap gap-2 items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--text-muted)' }}>Regenerate QR codes</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  Only needed if tickets were lost or you want to invalidate existing claim links.
                </p>
              </div>
              <button onClick={handleGenerateTokens} disabled={loading}
                className="font-bold px-5 py-2 rounded-lg flex-shrink-0"
                style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}>
                {loading ? 'Working…' : 'Regenerate'}
              </button>
            </div>

            {/* Mystery prize visibility */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Mystery prizes</p>
              <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                These are separate from the main cash pot — it&apos;s up to you to arrange and fund them. Toggle off any you don&apos;t want to use.
              </p>
              <div className="flex flex-col gap-0" style={{ border: '1px solid var(--border)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                {(['most_own_goals', 'bicycle'] as const).map((slug, i) => {
                  const label = slug === 'most_own_goals' ? '😬 Oooops' : '🤸 The Bicycle';
                  const description = slug === 'most_own_goals'
                    ? 'The team conceding the most spectacular own goal'
                    : 'Best overhead kick of the tournament';
                  const isHidden = hiddenPrizes.has(slug);
                  const isVisible = !isHidden;
                  return (
                    <div key={slug} className="flex items-center justify-between gap-3 px-3 py-2.5"
                      style={{ borderTop: i > 0 ? '1px solid var(--border)' : undefined }}>
                      <div className="min-w-0">
                        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{description}</p>
                      </div>
                      <button
                        role="switch"
                        aria-checked={isVisible}
                        onClick={() => handleTogglePrize(slug, !isHidden)}
                        disabled={loading}
                        className="flex items-center gap-2 flex-shrink-0"
                        style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', padding: 0, opacity: loading ? 0.5 : 1 }}
                      >
                        <span className="text-xs font-semibold" style={{ color: isVisible ? '#166534' : 'var(--text-muted)', minWidth: '3rem', textAlign: 'right' }}>
                          {isVisible ? 'Visible' : 'Hidden'}
                        </span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center',
                          width: '2.5rem', height: '1.375rem', borderRadius: '9999px', padding: '0.125rem',
                          background: isVisible ? 'var(--green)' : 'var(--border)',
                          transition: 'background 0.2s',
                          flexShrink: 0,
                        }}>
                          <span style={{
                            width: '1.125rem', height: '1.125rem', borderRadius: '9999px', background: '#fff',
                            transform: isVisible ? 'translateX(1.125rem)' : 'translateX(0)',
                            transition: 'transform 0.2s',
                            display: 'block',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }} />
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Participants */}
          <div className="rounded-xl p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Participants</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Edit names directly — changes save on blur. Tick the checkbox once someone has paid.
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
                      <Flag team={team} height="1.1rem" width="1.6rem" />
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
                          maxLength={50}
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
                      <input
                        type="checkbox"
                        checked={paid[team] ?? false}
                        onChange={() => togglePaid(team)}
                        title={paid[team] ? 'Paid' : 'Not paid'}
                        style={{ width: '1rem', height: '1rem', flexShrink: 0, cursor: 'pointer', accentColor: 'var(--green)' }}
                      />
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
