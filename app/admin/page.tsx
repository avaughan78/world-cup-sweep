'use client';

import { useState, useEffect, useRef } from 'react';
import { GROUPS_2026 } from '@/lib/groups';
import PasswordInput from '@/components/PasswordInput';
import Flag from '@/components/Flag';
import ThemeToggle from '@/components/ThemeToggle';

interface Company { id: number; code: string; name: string; ticket_price: number | null; max_teams_per_person: number; }

async function parseResponse(res: Response): Promise<{ ok: boolean; data: unknown; raw: string }> {
  const raw = await res.text();
  try {
    return { ok: res.ok, data: JSON.parse(raw), raw };
  } catch {
    return { ok: false, data: null, raw: raw || `HTTP ${res.status}` };
  }
}

export default function AdminPage() {
  const [password, setPassword] = useState(''); // only used during login form, never stored after
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

  // Max teams per person
  const [maxTeams, setMaxTeams] = useState('2');
  const [maxTeamsSaved, setMaxTeamsSaved] = useState(false);

  // Company name / code editing
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Admin password
  const [adminPw, setAdminPw] = useState('');
  const [confirmAdminPw, setConfirmAdminPw] = useState('');
  const [adminPwError, setAdminPwError] = useState('');
  const [adminPwSaved, setAdminPwSaved] = useState(false);

  // Manual prize overrides
  const [shotTeam, setShotTeam] = useState('');
  const [shotPlayer, setShotPlayer] = useState('');
  const [shotYards, setShotYards] = useState('');
  const [shotUrl, setShotUrl] = useState('');
  const [ownGoalTeam, setOwnGoalTeam] = useState('');
  const [ownGoalUrl, setOwnGoalUrl] = useState('');
  const [bicycleTeam, setBicycleTeam] = useState('');
  const [bicyclePlayer, setBicyclePlayer] = useState('');
  const [bicycleUrl, setBicycleUrl] = useState('');
  const [shotSaved,    setShotSaved]    = useState(false);
  const [ownGoalSaved, setOwnGoalSaved] = useState(false);
  const [bicycleSaved, setBicycleSaved] = useState(false);
  const [globalRemoved, setGlobalRemoved] = useState<Set<string>>(new Set());

  // Track last-persisted values so auto-save doesn't fire on initial load
  const lastShot     = useRef({ team: '', player: '', url: '' });
  const lastOwnGoal  = useRef({ team: '', url: '' });
  const lastBicycle  = useRef({ team: '', player: '', url: '' });
  const shotTimer    = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ownGoalTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const bicycleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) ?? null;

  // Auto-dismiss toast
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(null), 6000);
    return () => clearTimeout(t);
  }, [status]);

  // Restore session via HttpOnly cookie (server validates it)
  useEffect(() => {
    fetch('/api/admin/companies')
      .then(r => { if (r.ok) setAuthed(true); })
      .catch(() => {});
  }, []);

  // Load companies after auth
  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/companies')
      .then(r => r.json())
      .then((d: { companies?: Company[] }) => {
        const list = d.companies ?? [];
        setCompanies(list);
        if (list.length === 1) setSelectedCompanyId(list[0].id);
      })
      .catch(() => {});
  }, [authed]);

  // Load global prize overrides after auth
  useEffect(() => {
    if (!authed) return;
    fetch('/api/admin/global-overrides')
      .then(r => r.json())
      .then((d: { overrides?: Array<{ category: string; team_name: string | null; value_label: string | null; notes: string | null }> }) => {
        const hidden = new Set<string>();
        for (const o of d.overrides ?? []) {
          if (o.team_name === '__hidden__') {
            hidden.add(o.category);
          } else {
            if (o.category === 'longest_shot') {
              const team = o.team_name ?? '', raw = o.value_label ?? '', url = o.notes ?? '';
              const [player, yards] = raw.includes('|') ? raw.split('|') : [raw, ''];
              setShotTeam(team); setShotPlayer(player); setShotYards(yards); setShotUrl(url);
              lastShot.current = { team, player: raw, url };
            } else if (o.category === 'most_own_goals') {
              const team = o.team_name ?? '', url = o.notes ?? '';
              setOwnGoalTeam(team); setOwnGoalUrl(url);
              lastOwnGoal.current = { team, url };
            } else if (o.category === 'bicycle') {
              const team = o.team_name ?? '', player = o.value_label ?? '', url = o.notes ?? '';
              setBicycleTeam(team); setBicyclePlayer(player); setBicycleUrl(url);
              lastBicycle.current = { team, player, url };
            }
          }
        }
        setGlobalRemoved(hidden);
      })
      .catch(() => {});
  }, [authed]);

  // Sync editable fields when company changes
  useEffect(() => {
    const company = companies.find(c => c.id === selectedCompanyId);
    setTicketPrice(company?.ticket_price != null ? String(company.ticket_price) : '');
    setMaxTeams(String(company?.max_teams_per_person ?? 2));
    setEditName(company?.name ?? '');
    setEditCode(company?.code ?? '');
    setAdminPw('');
    setConfirmAdminPw('');
    setAdminPwError('');
  }, [selectedCompanyId, companies]);

  // Load participants when company changes
  useEffect(() => {
    if (!authed || !selectedCompanyId) { setNames({}); setSaved({}); return; }
    fetch('/api/admin/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: selectedCompanyId }),
    })
      .then(r => r.json())
      .then((d: { participants?: Array<{ team_name: string; participant_name: string | null }> }) => {
        const map: Record<string, string> = {};
        for (const p of d.participants ?? []) map[p.team_name] = p.participant_name ?? '';
        setNames(map);
        setSaved(map);
      })
      .catch(() => {});
  }, [authed, selectedCompanyId]);

  // Auto-save prize fields 800ms after last change (skip if unchanged from last save)
  useEffect(() => {
    const ls = lastShot.current;
    const encoded = shotYards.trim() ? `${shotPlayer}|${shotYards.trim()}` : shotPlayer;
    if (shotTeam === ls.team && encoded === ls.player && shotUrl === ls.url) return;
    clearTimeout(shotTimer.current);
    shotTimer.current = setTimeout(async () => {
      await fetch('/api/admin/shot', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: shotTeam, value_label: encoded, notes: shotUrl }) });
      lastShot.current = { team: shotTeam, player: encoded, url: shotUrl };
      setShotSaved(true);
      setTimeout(() => setShotSaved(false), 2000);
    }, 800);
  }, [shotTeam, shotPlayer, shotYards, shotUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ls = lastOwnGoal.current;
    if (ownGoalTeam === ls.team && ownGoalUrl === ls.url) return;
    clearTimeout(ownGoalTimer.current);
    ownGoalTimer.current = setTimeout(async () => {
      await fetch('/api/admin/owngoal', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: ownGoalTeam, value_label: null, notes: ownGoalUrl }) });
      lastOwnGoal.current = { team: ownGoalTeam, url: ownGoalUrl };
      setOwnGoalSaved(true);
      setTimeout(() => setOwnGoalSaved(false), 2000);
    }, 800);
  }, [ownGoalTeam, ownGoalUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const ls = lastBicycle.current;
    if (bicycleTeam === ls.team && bicyclePlayer === ls.player && bicycleUrl === ls.url) return;
    clearTimeout(bicycleTimer.current);
    bicycleTimer.current = setTimeout(async () => {
      await fetch('/api/admin/bicycle', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: bicycleTeam, value_label: bicyclePlayer, notes: bicycleUrl }) });
      lastBicycle.current = { team: bicycleTeam, player: bicyclePlayer, url: bicycleUrl };
      setBicycleSaved(true);
      setTimeout(() => setBicycleSaved(false), 2000);
    }, 800);
  }, [bicycleTeam, bicyclePlayer, bicycleUrl]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setPassword(''); // clear from memory; session is now in HttpOnly cookie
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
        body: JSON.stringify({ code, name }),
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
      const res = await fetch(`/api/admin/companies?id=${selectedCompany.id}`, {
        method: 'DELETE',
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as { error?: string } | null;
      if (ok) {
        setCompanies(prev => prev.filter(c => c.id !== selectedCompany.id));
        setSelectedCompanyId(null);
        setStatus({ ok: true, message: `"${selectedCompany.name}" deleted.` });
      } else {
        setStatus({ ok: false, message: d?.error ?? raw });
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
        body: JSON.stringify({ company_id: selectedCompanyId, team_name: team, participant_name: value }),
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
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as Record<string, unknown> | null;
      setStatus({ ok, message: d ? JSON.stringify(d.results ?? d, null, 2) : raw });
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  async function handlePrewarmSquads() {
    setLoading(true);
    setStatus({ ok: true, message: 'Starting squad photo pre-warm…' });
    let remaining = 999;
    let fetched = 0;
    let lastTeam = '';
    const skipped = new Set<string>();
    try {
      while (remaining > 0) {
        const res = await fetch('/api/admin/prewarm-squads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ skipTeams: [...skipped] }),
        });
        const { ok, data } = await parseResponse(res);
        const d = data as Record<string, unknown> | null;
        if (!ok || !d) { setStatus({ ok: false, message: 'Pre-warm request failed' }); break; }
        if (d.done) {
          const skippedNote = skipped.size ? ` (${skipped.size} team${skipped.size !== 1 ? 's' : ''} skipped — retry later)` : '';
          setStatus({ ok: true, message: `Done — all teams processed.${skippedNote}` });
          break;
        }
        remaining = (d.remaining as number) ?? 0;
        const thisTeam = d.team as string;
        // If we got the same team again it didn't improve — skip it and continue
        if (thisTeam === lastTeam) {
          skipped.add(thisTeam);
          setStatus({ ok: true, message: `Pre-warming… skipping ${thisTeam} (low coverage), trying next — ${remaining} remaining` });
        } else {
          fetched++;
          setStatus({ ok: true, message: `Pre-warming… fetched ${fetched} team${fetched !== 1 ? 's' : ''} — ${remaining} remaining (${thisTeam}: ${d.photos}/${d.players} photos)` });
        }
        lastTeam = thisTeam;
        if (remaining === 0) { setStatus({ ok: true, message: `Done — all ${fetched} teams pre-warmed.` }); break; }
      }
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
        body: JSON.stringify({}),
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
        body: JSON.stringify({ company_id: selectedCompanyId }),
      });
      const { ok, data, raw } = await parseResponse(res);
      const d = data as Record<string, unknown> | null;
      setStatus({ ok: ok && !!d?.ok, message: (d?.message as string) ?? raw });
    } catch (e) {
      setStatus({ ok: false, message: String(e) });
    }
    setLoading(false);
  }

  async function clearPrize(endpoint: string, resetFns: Array<() => void>, label: string) {
    if (!confirm(`Clear ${label}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team_name: '', value_label: null, notes: '' }),
      });
      const { ok, data } = await parseResponse(res);
      const d = data as Record<string, unknown> | null;
      if (ok && d?.ok) resetFns.forEach(fn => fn());
      else setStatus({ ok: false, message: 'Clear failed' });
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
    setLoading(false);
  }

  async function handleToggleMysteryGlobally(hide: boolean) {
    const action = hide ? 'hide' : 'show';
    if (!confirm(`${hide ? 'Hide' : 'Show'} both mystery prizes for ALL companies?`)) return;
    setLoading(true);
    setStatus(null);
    try {
      await Promise.all(['most_own_goals', 'bicycle'].map(slug =>
        fetch('/api/admin/remove-prize-global', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug, hidden: hide }),
        })
      ));
      setGlobalRemoved(hide ? new Set(['most_own_goals', 'bicycle']) : new Set());
      setStatus({ ok: true, message: `Mystery prizes ${action}n globally.` });
    } catch (e) { setStatus({ ok: false, message: String(e) }); }
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
        body: JSON.stringify({ id: selectedCompany.id, name, code }),
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
    if (!adminPw.trim()) { setAdminPwError('Password cannot be empty'); return; }
    if (adminPw.trim() !== confirmAdminPw.trim()) { setAdminPwError('Passwords do not match'); return; }
    setAdminPwError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCompany.id, admin_password: adminPw }),
      });
      const { ok } = await parseResponse(res);
      if (ok) {
        setAdminPw('');
        setConfirmAdminPw('');
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
        body: JSON.stringify({ id: selectedCompany.id, ticket_price: isNaN(price) ? null : price }),
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

  async function handleSaveMaxTeams() {
    if (!selectedCompany) return;
    const val = Math.max(1, Math.min(10, parseInt(maxTeams, 10)));
    if (isNaN(val)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCompany.id, max_teams_per_person: val }),
      });
      const { ok } = await parseResponse(res);
      if (ok) {
        setCompanies(prev => prev.map(c => c.id === selectedCompany.id ? { ...c, max_teams_per_person: val } : c));
        setMaxTeamsSaved(true);
        setTimeout(() => setMaxTeamsSaved(false), 2000);
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
        body: JSON.stringify({ company_id: selectedCompanyId }),
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
          <PasswordInput
            value={password}
            onChange={v => { setPassword(v); setLoginError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password"
            inputStyle={inputStyle}
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
              <a href="/admin/audit" className="text-sm" style={{ color: 'var(--text-muted)' }}>Audit log</a>
              <a href="/" className="text-sm" style={{ color: 'var(--text-muted)' }}>← Back to site</a>
              <button
                type="button"
                className="text-sm"
                style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                onClick={() => {
                  const code = localStorage.getItem('company_code');
                  window.location.href = code ? `/?code=${code}` : '/';
                }}
              >Log out</button>
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
                onClick={handlePrewarmSquads}
                disabled={loading}
                className="font-bold px-5 py-2 rounded-lg transition-opacity"
                style={{ background: 'var(--card)', color: 'var(--text-primary)', border: '1px solid var(--border)', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
                title="Fetch squad photos for all teams that don't have them yet"
              >
                {loading ? 'Pre-warming…' : 'Pre-warm Squad Photos'}
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

          {/* Global manual prizes */}
          <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-muted)' }}>Manual Prizes (Global — all companies)</p>

            {(() => {
              const allTeams = Object.values(GROUPS_2026).flat().sort();
              const teamSelect = (value: string, onChange: (v: string) => void) => (
                <select value={value} onChange={e => onChange(e.target.value)} style={{ width: '100%', ...smallInputStyle }}>
                  <option value="">— Select team —</option>
                  {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              );
              const cardStyle: React.CSSProperties = { background: '#ffffff', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' };
              const labelStyle: React.CSSProperties = { fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' };
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">

                  {/* Thunderbastard */}
                  <div style={cardStyle}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>🚀 Thunderbastard</span>
                      {shotSaved && <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>Saved ✓</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div><label style={labelStyle}>Team</label>{teamSelect(shotTeam, setShotTeam)}</div>
                      <div><label style={labelStyle}>Player</label>
                        <input placeholder="Player name" value={shotPlayer} onChange={e => setShotPlayer(e.target.value)} maxLength={60} style={{ width: '100%', ...smallInputStyle }} />
                      </div>
                      <div><label style={labelStyle}>Distance</label>
                        <input placeholder="Yards (e.g. 35)" value={shotYards} onChange={e => setShotYards(e.target.value)} maxLength={6} style={{ width: '100%', ...smallInputStyle }} />
                      </div>
                      <div><label style={labelStyle}>Video URL</label>
                        <input placeholder="https://…" value={shotUrl} onChange={e => setShotUrl(e.target.value)} maxLength={300} style={{ width: '100%', ...smallInputStyle }} />
                      </div>
                      <button onClick={() => clearPrize('/api/admin/shot', [
                        () => { setShotTeam(''); setShotPlayer(''); setShotYards(''); setShotUrl(''); lastShot.current = { team: '', player: '', url: '' }; },
                      ], 'Thunderbastard data')} disabled={loading} className="text-xs font-semibold py-1.5 rounded-lg transition-opacity mt-1"
                        style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', opacity: loading ? 0.5 : 1 }}>
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* OG */}
                  <div style={cardStyle}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>😬 OG</span>
                      {ownGoalSaved && <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>Saved ✓</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div><label style={labelStyle}>Team</label>{teamSelect(ownGoalTeam, setOwnGoalTeam)}</div>
                      <div><label style={labelStyle}>Video URL</label>
                        <input placeholder="https://…" value={ownGoalUrl} onChange={e => setOwnGoalUrl(e.target.value)} maxLength={300} style={{ width: '100%', ...smallInputStyle }} />
                      </div>
                      <button onClick={() => clearPrize('/api/admin/owngoal', [
                        () => { setOwnGoalTeam(''); setOwnGoalUrl(''); lastOwnGoal.current = { team: '', url: '' }; },
                      ], 'OG data')} disabled={loading} className="text-xs font-semibold py-1.5 rounded-lg transition-opacity mt-1"
                        style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', opacity: loading ? 0.5 : 1 }}>
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Bicycle */}
                  <div style={cardStyle}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>🤸 The Bicycle</span>
                      {bicycleSaved && <span style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 700 }}>Saved ✓</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div><label style={labelStyle}>Team</label>{teamSelect(bicycleTeam, setBicycleTeam)}</div>
                      <div><label style={labelStyle}>Player</label>
                        <input placeholder="Player name" value={bicyclePlayer} onChange={e => setBicyclePlayer(e.target.value)} maxLength={60} style={{ width: '100%', ...smallInputStyle }} />
                      </div>
                      <div><label style={labelStyle}>Video URL</label>
                        <input placeholder="https://…" value={bicycleUrl} onChange={e => setBicycleUrl(e.target.value)} maxLength={300} style={{ width: '100%', ...smallInputStyle }} />
                      </div>
                      <button onClick={() => clearPrize('/api/admin/bicycle', [
                        () => { setBicycleTeam(''); setBicyclePlayer(''); setBicycleUrl(''); lastBicycle.current = { team: '', player: '', url: '' }; },
                      ], 'Bicycle data')} disabled={loading} className="text-xs font-semibold py-1.5 rounded-lg transition-opacity mt-1"
                        style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', opacity: loading ? 0.5 : 1 }}>
                        Clear
                      </button>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Global mystery prize toggle */}
            {(() => {
              const bothHidden = globalRemoved.has('most_own_goals') && globalRemoved.has('bicycle');
              return (
                <div className="mt-3 pt-3 flex items-center justify-between gap-3" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Oooops and Bicycle are mystery prizes — hide them globally if unused.
                  </p>
                  <button
                    onClick={() => handleToggleMysteryGlobally(!bothHidden)}
                    disabled={loading}
                    className="font-bold px-4 py-2 rounded-lg transition-opacity text-sm flex-shrink-0"
                    style={{
                      background: bothHidden ? '#f0fdf4' : '#fee2e2',
                      color: bothHidden ? '#166534' : '#991b1b',
                      border: `1px solid ${bothHidden ? '#bbf7d0' : '#fecaca'}`,
                      opacity: loading ? 0.5 : 1,
                    }}>
                    {bothHidden ? 'Mystery Prizes Hidden — Show All' : 'Hide Both Mystery Prizes'}
                  </button>
                </div>
              );
            })()}
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
                maxLength={10}
                style={{ ...smallInputStyle, flex: '1 1 120px', minWidth: 0 }}
              />
              <input
                placeholder="Company name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={60}
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

                {/* Max teams per person */}
                <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Max Teams Per Person (Lucky Dip)</p>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="1"
                    value={maxTeams}
                    onChange={e => setMaxTeams(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveMaxTeams()}
                    style={{ ...smallInputStyle, width: '5rem' }}
                  />
                  <button
                    onClick={handleSaveMaxTeams}
                    disabled={loading}
                    className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                    style={{ background: maxTeamsSaved ? '#f0fdf4' : 'var(--green)', color: maxTeamsSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
                  >
                    {maxTeamsSaved ? 'Saved ✓' : 'Save'}
                  </button>
                  <p className="w-full text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    How many teams each person can draw in the lucky dip. Default is 2.
                  </p>
                </div>

                {/* Company name / code */}
                <div className="mt-4 pt-4 flex flex-wrap gap-2 items-end" style={{ borderTop: '1px solid var(--border)' }}>
                  <p className="w-full text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>Company Details</p>
                  <input
                    placeholder="Company name"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    maxLength={60}
                    style={{ flex: '2 1 180px', minWidth: 0, ...smallInputStyle }}
                  />
                  <input
                    placeholder="Code"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value.toUpperCase())}
                    maxLength={10}
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
                  <PasswordInput
                    value={adminPw}
                    onChange={v => { setAdminPw(v); setAdminPwError(''); }}
                    placeholder="New password"
                    wrapperStyle={{ flex: '1 1 150px', minWidth: 0 }}
                    inputStyle={smallInputStyle}
                  />
                  <PasswordInput
                    value={confirmAdminPw}
                    onChange={v => { setConfirmAdminPw(v); setAdminPwError(''); }}
                    placeholder="Confirm password"
                    wrapperStyle={{ flex: '1 1 150px', minWidth: 0 }}
                    inputStyle={smallInputStyle}
                  />
                  <button
                    onClick={handleSaveAdminPassword}
                    disabled={loading}
                    className="font-bold px-5 py-2 rounded-lg transition-colors flex-shrink-0"
                    style={{ background: adminPwSaved ? '#f0fdf4' : 'var(--green)', color: adminPwSaved ? '#166534' : '#fff', opacity: loading ? 0.5 : 1, fontSize: '0.9rem' }}
                  >
                    {adminPwSaved ? 'Saved ✓' : 'Set Password'}
                  </button>
                  {adminPwError && <p className="w-full text-xs mt-1" style={{ color: '#ef4444' }}>{adminPwError}</p>}
                  <p className="w-full text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Gives the organiser access to <a href={`/manage?code=${selectedCompany?.code}`} target="_blank" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>/manage?code={selectedCompany?.code}</a>
                  </p>
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
                          <Flag team={team} height="1.1rem" width="1.6rem" />
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
                              maxLength={50}
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
