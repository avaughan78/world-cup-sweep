'use client';

import { useState, useEffect } from 'react';
import { GROUPS_2026 } from '@/lib/groups';
import { getFlag } from '@/lib/flags';
import ThemeToggle from '@/components/ThemeToggle';

interface Company { id: number; code: string; name: string; ticket_price: number | null; }

async function parseResponse(res: Response): Promise<{ ok: boolean; data: unknown; raw: string }> {
  const raw = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(raw), raw };
  } catch {
    return { ok: false, data: null, raw: raw || `HTTP ${res.status}` };
  }
}

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');

  // Participants
  const [names, setNames] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [justSaved, setJustSaved] = useState<Set<string>>(new Set());

  const [copied, setCopied] = useState(false);

  // Ticket price
  const [ticketPrice, setTicketPrice] = useState('');
  const [priceSaved, setPriceSaved] = useState(false);

  // Company name / code editing
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Admin password
  const [adminPw, setAdminPw] = useState('');
  const [adminPwSaved, setAdminPwSaved] = useState(false);

  // Longest shot
  const [shotTeam, setShotTeam] = useState('');
  const [shotLabel, setShotLabel] = useState('');
  const [shotNotes, setShotNotes] = useState('');

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) ?? null;

  // Auto-dismiss toast
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(t);
  }, [status]);

  // Restore session from cookie
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)admin_pw=([^;]*)/);
    if (match) {
      setPassword(decodeURIComponent(match[1]));
      setAuthed(true);
    }
  }, []);

  // Load companies after auth
  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/companies', { headers: { 'x-admin-password': password } })
      .then(r => r.json())
      .then((d: { companies?: Company[] }) => {
        const list = d.companies ?? [];
        setCompanies(list);
        if (list.length === 1) setSelectedCompanyId(list[0].id);
      })
      .catch(() => {});
  }, [authed, password]);

  // Sync editable fields when company changes
  useEffect(() => {
    const company = companies.find(c => c.id === selectedCompanyId);
    setTicketPrice(company?.ticket_price != null ? String(company.ticket_price) : '');
    setEditName(company?.name ?? '');
    setEditCode(company?.code ?? '');
    setAdminPw('');
  }, [selectedCompanyId, companies]);

  // Load participants when company changes
  useEffect(() => {
    if (!authed || !selectedCompanyId) { setNames({}); setSaved({}); return; }
    fetch('/api/admin/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, company_id: selectedCompanyId }),
    })
      .then(r => r.json())
      .then((d: { participants?: Array<{ team_name: string; participant_name: string | null }> }) => {
        const map: Record<string, string> = {};
        for (const p of d.participants ?? []) map[p.team_name] = p.participant_name ?? '';
        setNames(map);
        setSaved(map);
      })
      .catch(() => {});
  }, [authed, password, selectedCompanyId]);

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
        document.cookie = `admin_pw=${encodeURIComponent(password)}; max-age=${7 * 24 * 3600}; path=/; SameSite=Strict; Secure`;
        setAuthed(true);
      } else {
        setLoginError('Wrong password');
      }
    } catch {
      setLoginError('Could not connect to server');
    }
    setLoading(false);
  }

  async function handleCreateCompany() {
    const code = newCode.trim().toUpperCase();
    const name = newName.trim();
    if (!code || !name) { setStatus({ ok: false, message: 'Code and name are required' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, code, name }),
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as { company?: Company; message?: string } | null;
      if (ok && d?.company) {
        setCompanies(prev => [...prev, d.company!].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedCompanyId(d.company.id);
        setNewCode('');
        setNewName('');
        setStatus({ ok: true, message: `Company "${name}" created.` });
      } else {
        setStatus({ ok: false, message: d?.message ?? raw });
      }
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  async function handleDeleteCompany() {
    if (!selectedCompany) return;
    if (!confirm(`Delete "${selectedCompany.name}" and all its participant data? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id: selectedCompany.id }),
      });
      const { ok } = await parseResponse(res);
      if (ok) {
        setCompanies(prev => prev.filter(c => c.id !== selectedCompany.id));
        setSelectedCompanyId(null);
        setStatus({ ok: true, message: `"${selectedCompany.name}" deleted.` });
      }
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  async function saveName(team: string) {
    if (!selectedCompanyId) return;
    const value = names[team] ?? '';
    if (value === (saved[team] ?? '')) return;
    setSaving(prev => new Set(prev).add(team));
    try {
      await fetch('/api/admin/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, company_id: selectedCompanyId, team_name: team, participant_name: value }),
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

  async function handleResetStats() {
    if (!confirm('Clear all tournament stats, scores, and standings? This cannot be undone.')) return;
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
    if (!selectedCompanyId) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/generate-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, company_id: selectedCompanyId }),
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
    if (!selectedCompanyId) return;
    if (!shotTeam.trim()) { setStatus({ ok: false, message: 'Team name is required' }); return; }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/shot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, company_id: selectedCompanyId, team_name: shotTeam, value_label: shotLabel, notes: shotNotes }),
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as Record<string, unknown> | null;
      setStatus({ ok: ok && !!d?.ok, message: d?.ok ? 'Saved!' : raw });
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  async function handleSaveDetails() {
    if (!selectedCompany) return;
    const name = editName.trim();
    const code = editCode.trim().toUpperCase();
    if (!name || !code) { setStatus({ ok: false, message: 'Name and code are required' }); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id: selectedCompany.id, name, code }),
      });
      const { ok, data } = await parseResponse(res);
      const d = data as { ok?: boolean; company?: Company } | null;
      if (ok && d?.company) {
        setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, ...d.company! } : c));
        setDetailsSaved(true);
        setTimeout(() => setDetailsSaved(false), 2000);
      }
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
    setLoading(false);
  }

  async function handleSaveAdminPassword() {
    if (!selectedCompany) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id: selectedCompany.id, admin_password: adminPw }),
      });
      const { ok } = await parseResponse(res);
      if (ok) {
        setAdminPwSaved(true);
        setTimeout(() => setAdminPwSaved(false), 2000);
      }
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
    setLoading(false);
  }

  async function handleSaveTicketPrice() {
    if (!selectedCompany) return;
    const price = parseFloat(ticketPrice);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id: selectedCompany.id, ticket_price: isNaN(price) ? null : price }),
      });
      const { ok } = await parseResponse(res);
      if (ok) {
        setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, ticket_price: isNaN(price) ? null : price } : c));
        setPriceSaved(true);
        setTimeout(() => setPriceSaved(false), 2000);
      }
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  async function handleCopyLink() {
    if (!selectedCompany) return;
    const url = `${window.location.origin}/?code=${selectedCompany.code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleResetCompany() {
    if (!selectedCompany) return;
    if (!confirm(`Clear all participant names and QR codes for "${selectedCompany.name}"? This cannot be undone.`)) return;
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, company_id: selectedCompanyId }),
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as Record<string, unknown> | null;
      if (ok && d?.ok) {
        setNames({});
        setSaved({});
      }
      setStatus({ ok: ok && !!d?.ok, message: (d?.message as string) ?? raw });
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

  const smallInputStyle: React.CSSProperties = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
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
      {/* Toast */}
      {status && (
        <div
          className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 rounded-xl px-4 py-3 text-sm shadow-xl flex items-start gap-3"
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
              <a href="/api/admin/logout" className="text-sm" style={{ color: 'var(--text-muted)' }}>Log out</a>
            </div>
          </div>
          <hr className="mt-5" style={{ borderColor: 'var(--separator)' }} />
        </header>

        <div className="py-10 space-y-8">

          {/* Global actions */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Tournament (Global)</p>
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
                onClick={handleResetStats}
                disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity"
                style={{ background: '#fee2e2', color: '#991b1b', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
              >
                Reset Tournament Stats
              </button>
            </div>
          </div>

          {/* Companies */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>Companies</p>

            {/* Company selector */}
            {companies.length > 0 && (
              <div className="mb-4">
                <select
                  value={selectedCompanyId ?? ''}
                  onChange={e => setSelectedCompanyId(Number(e.target.value) || null)}
                  style={{ ...smallInputStyle, width: '100%', maxWidth: '24rem' }}
                >
                  <option value="">— Select a company —</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Create company */}
            <div className="flex flex-wrap gap-2 items-end" style={{ borderTop: companies.length > 0 ? '1px solid var(--border)' : undefined, paddingTop: companies.length > 0 ? '1rem' : undefined }}>
              <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Add Company</p>
              <input
                placeholder="Code (e.g. ACME26)"
                value={newCode}
                onChange={e => setNewCode(e.target.value.toUpperCase())}
                style={{ ...smallInputStyle, flex: '1 1 120px', minWidth: 0 }}
              />
              <input
                placeholder="Company name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                style={{ ...smallInputStyle, flex: '2 1 180px', minWidth: 0 }}
              />
              <button
                onClick={handleCreateCompany}
                disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity flex-shrink-0"
                style={{ background: 'var(--green)', color: '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
              >
                Create
              </button>
            </div>
          </div>

          {/* Company-scoped section */}
          {selectedCompany && (
            <>
              {/* Company actions */}
              <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
                  {selectedCompany.code} · {selectedCompany.name}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerateTokens}
                    disabled={loading}
                    className="font-bold px-5 py-2 rounded-lg transition-opacity"
                    style={{ background: 'var(--text-primary)', color: 'var(--bg)', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
                  >
                    Generate QR Codes
                  </button>
                  <a
                    href={`/print?code=${selectedCompany.code}`}
                    target="_blank"
                    className="font-bold px-5 py-2 rounded-lg"
                    style={{ background: 'var(--green)', color: '#fff', fontSize: '0.9rem' }}
                  >
                    Print Tickets ↗
                  </a>
                  <a
                    href={`/?code=${selectedCompany.code}`}
                    target="_blank"
                    className="font-bold px-5 py-2 rounded-lg"
                    style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
                  >
                    View Draw ↗
                  </a>
                  <button
                    onClick={handleCopyLink}
                    className="font-bold px-5 py-2 rounded-lg transition-colors"
                    style={{ background: copied ? '#f0fdf4' : 'var(--bg)', color: copied ? '#166534' : 'var(--text-muted)', border: `1px solid ${copied ? '#bbf7d0' : 'var(--border)'}`, fontSize: '0.9rem' }}
                  >
                    {copied ? 'Copied!' : 'Copy Link'}
                  </button>
                  <button
                    onClick={handleResetCompany}
                    disabled={loading}
                    className="font-bold px-5 py-2 rounded-lg transition-opacity"
                    style={{ background: '#fee2e2', color: '#991b1b', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
                  >
                    Reset Draw
                  </button>
                  <button
                    onClick={handleDeleteCompany}
                    disabled={loading}
                    className="font-bold px-5 py-2 rounded-lg transition-opacity"
                    style={{ background: '#fef2f2', color: '#991b1b', opacity: loading ? 0.5 : 1, fontSize: '0.9rem', border: '1px solid #fecaca' }}
                  >
                    Delete Company
                  </button>
                </div>

                {/* Ticket price */}
                <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Ticket Price</p>
                  <div className="flex items-center gap-1 flex-shrink-0" style={{ ...smallInputStyle, padding: '0.5rem 0.75rem', width: 'auto' }}>
                    <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>£</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={ticketPrice}
                      onChange={e => setTicketPrice(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSaveTicketPrice()}
                      style={{ background: 'transparent', border: 'none', outline: 'none', width: '5rem', color: 'var(--text-primary)', fontSize: '0.875rem' }}
                    />
                  </div>
                  <button
                    onClick={handleSaveTicketPrice}
                    disabled={loading}
                    className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                    style={{ background: priceSaved ? '#f0fdf4' : 'var(--green)', color: priceSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
                  >
                    {priceSaved ? 'Saved ✓' : 'Save'}
                  </button>
                  <p className="w-full text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Sets prize amounts shown on the draw page (48 tickets × price × split).
                  </p>
                </div>

                {/* Company name / code */}
                <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Company Details</p>
                  <input
                    placeholder="Company name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{ flex: '2 1 180px', minWidth: 0, ...smallInputStyle }}
                  />
                  <input
                    placeholder="Code"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value.toUpperCase())}
                    style={{ flex: '1 1 100px', minWidth: 0, ...smallInputStyle }}
                  />
                  <button
                    onClick={handleSaveDetails}
                    disabled={loading}
                    className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                    style={{ background: detailsSaved ? '#f0fdf4' : 'var(--green)', color: detailsSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
                  >
                    {detailsSaved ? 'Saved ✓' : 'Save'}
                  </button>
                </div>

                {/* Admin password */}
                <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Organiser Admin Password</p>
                  <input
                    type="text"
                    placeholder="e.g. football"
                    value={adminPw}
                    onChange={e => setAdminPw(e.target.value)}
                    style={{ flex: '1 1 160px', minWidth: 0, ...smallInputStyle }}
                  />
                  <button
                    onClick={handleSaveAdminPassword}
                    disabled={loading}
                    className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                    style={{ background: adminPwSaved ? '#f0fdf4' : 'var(--green)', color: adminPwSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
                  >
                    {adminPwSaved ? 'Saved ✓' : 'Set Password'}
                  </button>
                  <p className="w-full text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Gives the organiser access to <a href={`/manage?code=${selectedCompany?.code}`} target="_blank" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>/manage?code={selectedCompany?.code}</a>
                  </p>
                </div>

                {/* Longest shot override */}
                <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Longest Shot Override</p>
                  <input
                    placeholder="Team"
                    value={shotTeam}
                    onChange={e => setShotTeam(e.target.value)}
                    style={{ flex: '1 1 130px', minWidth: 0, ...smallInputStyle }}
                  />
                  <input
                    placeholder="Label (e.g. 38.2m — Rüdiger)"
                    value={shotLabel}
                    onChange={e => setShotLabel(e.target.value)}
                    style={{ flex: '2 1 180px', minWidth: 0, ...smallInputStyle }}
                  />
                  <input
                    placeholder="Notes"
                    value={shotNotes}
                    onChange={e => setShotNotes(e.target.value)}
                    style={{ flex: '1 1 100px', minWidth: 0, ...smallInputStyle }}
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
                <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Participants — {selectedCompany.name}</h2>
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
            </>
          )}

        </div>
      </div>
    </main>
  );
}
