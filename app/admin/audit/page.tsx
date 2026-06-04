'use client';

import { useEffect, useState, useCallback } from 'react';

interface AuditEntry {
  id: number;
  event: string;
  actor: string | null;
  company_id: number | null;
  company_name: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

const EVENT_META: Record<string, { label: string; icon: string; colour: string }> = {
  admin_login_ok:      { label: 'Admin login',         icon: '🔑', colour: '#22c55e' },
  admin_login_fail:    { label: 'Admin login failed',  icon: '🚫', colour: '#ef4444' },
  company_login_ok:    { label: 'Sweep login',         icon: '🔐', colour: '#3b82f6' },
  company_login_fail:  { label: 'Sweep login failed',  icon: '⚠️',  colour: '#f59e0b' },
  sweep_created:       { label: 'Sweep created',       icon: '🆕', colour: '#a855f7' },
  company_created:     { label: 'Company created',     icon: '🏢', colour: '#a855f7' },
  company_updated:     { label: 'Company updated',     icon: '✏️',  colour: '#6366f1' },
  company_deleted:     { label: 'Company deleted',     icon: '🗑️',  colour: '#ef4444' },
  participant_claimed: { label: 'Team claimed',        icon: '🎟️',  colour: '#10b981' },
  tokens_generated:    { label: 'Tokens generated',   icon: '🔗', colour: '#0ea5e9' },
  company_reset:       { label: 'Sweep reset',         icon: '♻️',  colour: '#f97316' },
  tournament_reset:    { label: 'Tournament reset',    icon: '🔄', colour: '#ef4444' },
};

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details) return '';
  return Object.entries(details)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/audit');
    if (res.status === 401) { setError('Not authenticated — go back and log in to admin first.'); setLoading(false); return; }
    if (!res.ok) { setError('Failed to load audit log.'); setLoading(false); return; }
    const { entries: data } = await res.json() as { entries: AuditEntry[] };
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Refresh every 30s; also re-render every 30s to update "x ago" labels
  useEffect(() => {
    const t = setInterval(() => { load(); setTick(n => n + 1); }, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const filtered = filter.trim()
    ? entries.filter(e => {
        const q = filter.toLowerCase();
        return (
          e.event.includes(q) ||
          (e.actor ?? '').toLowerCase().includes(q) ||
          (e.company_name ?? '').toLowerCase().includes(q) ||
          (e.ip ?? '').includes(q) ||
          formatDetails(e.details).toLowerCase().includes(q)
        );
      })
    : entries;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text-primary)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-70"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', width: '2rem', height: '2rem', color: 'var(--text-muted)' }}
              aria-label="Back to admin"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            </a>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Audit Log</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Last 300 events · refreshes every 30s</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              ↺ Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="Filter by event, actor, company, IP…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="w-full mb-4 px-4 py-2 rounded-lg text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-primary)', outline: 'none' }}
        />

        {/* Stats strip */}
        {!loading && !error && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total events', value: entries.length },
              { label: 'Logins (ok)', value: entries.filter(e => e.event.endsWith('_ok')).length },
              { label: 'Failed logins', value: entries.filter(e => e.event.endsWith('_fail')).length },
              { label: 'Teams claimed', value: entries.filter(e => e.event === 'participant_claimed').length },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-4 py-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-black">{s.value}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {loading && (
          <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>Loading…</div>
        )}
        {error && (
          <div className="rounded-xl px-5 py-4 text-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#ef4444' }}>
            {error}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>
            {filter ? 'No matching events.' : 'No events logged yet.'}
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}>
                  {['Event', 'Actor / Company', 'Details', 'IP', 'When'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => {
                  const meta = EVENT_META[e.event] ?? { label: e.event, icon: '•', colour: 'var(--text-muted)' };
                  return (
                    <tr
                      key={e.id}
                      style={{
                        background: i % 2 === 0 ? 'var(--bg)' : 'var(--card)',
                        borderBottom: '1px solid var(--border)',
                      }}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: meta.colour }}>
                          <span>{meta.icon}</span>
                          <span>{meta.label}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                          {e.actor ?? '—'}
                        </span>
                        {e.company_name && (
                          <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>{e.company_name}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)', maxWidth: '16rem' }}>
                        {formatDetails(e.details) || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {e.ip ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}
                          title={new Date(e.created_at).toLocaleString()}>
                        {timeAgo(e.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
