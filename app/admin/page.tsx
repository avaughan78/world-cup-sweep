'use client';

import { useState } from 'react';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [shotTeam, setShotTeam] = useState('');
  const [shotLabel, setShotLabel] = useState('');
  const [shotNotes, setShotNotes] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      setStatus(JSON.stringify(data.results ?? data, null, 2));
    } catch (e) {
      setStatus(String(e));
    }
    setLoading(false);
  }

  async function handleShotOverride() {
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
      const data = await res.json();
      setStatus(data.ok ? '✓ Saved!' : `Error: ${JSON.stringify(data)}`);
    } catch (e) {
      setStatus(String(e));
    }
    setLoading(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-sm">
          <h1 className="text-white font-bold text-xl mb-6 text-center">Admin Panel</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setAuthed(true)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 mb-4 outline-none focus:ring-2 focus:ring-green-600"
          />
          <button
            onClick={() => setAuthed(true)}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <a href="/" className="text-slate-400 text-sm hover:text-white">← Back to site</a>
        </div>

        {/* Sync */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg">Sync Data</h2>
          <p className="text-slate-400 text-sm">
            Pulls from Google Sheets (names) + football-data.org (live stats) and saves to the database.
          </p>
          <button
            onClick={handleSync}
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>

        {/* Longest shot override */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg">🚀 Longest Range Shot</h2>
          <p className="text-slate-400 text-sm">
            Manually set the current record holder. Team name must match the spreadsheet exactly.
          </p>
          <input
            placeholder="Team name (e.g. Brazil)"
            value={shotTeam}
            onChange={e => setShotTeam(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-600"
          />
          <input
            placeholder="Label (e.g. 38.2m — Rüdiger vs USA)"
            value={shotLabel}
            onChange={e => setShotLabel(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-600"
          />
          <input
            placeholder="Notes (optional)"
            value={shotNotes}
            onChange={e => setShotNotes(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-amber-600"
          />
          <button
            onClick={handleShotOverride}
            disabled={loading}
            className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Saving…' : 'Save Shot Override'}
          </button>
        </div>

        {status && (
          <pre className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-green-300 overflow-auto whitespace-pre-wrap">
            {status}
          </pre>
        )}
      </div>
    </div>
  );
}
