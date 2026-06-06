'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';

export default function ResetConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '0.5rem', padding: '0.75rem 1rem',
    color: 'var(--text-primary)', fontSize: '1rem', outline: 'none',
  };

  async function handleSubmit() {
    if (!password.trim()) { setError('Please enter a new password.'); return; }
    if (password.trim() !== confirm.trim()) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/company/reset-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: password.trim() }),
      });
      const data = await res.json() as { ok: boolean; code?: string; error?: string };
      if (data.ok && data.code) {
        router.replace(`/manage?code=${data.code}`);
      } else {
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Could not connect');
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
        <div className="px-7 pt-7 pb-6" style={{
          backgroundImage: 'url(/wc2026-header-bg.png)',
          backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
        }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
            FIFA World Cup · 2026
          </p>
          <h1 className="album-title text-5xl font-black tracking-tight mt-1" style={{ color: '#fff', lineHeight: 1 }}>
            WC26 Sweep
          </h1>
          <p className="text-sm mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Set new password
          </p>
        </div>

        <div className="px-7 py-6 space-y-3" style={{ background: 'var(--card)' }}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              New password
            </label>
            <PasswordInput
              value={password}
              onChange={v => { setPassword(v); setError(''); }}
              placeholder="New password"
              inputStyle={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Confirm password
            </label>
            <PasswordInput
              value={confirm}
              onChange={v => { setConfirm(v); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="Repeat password"
              inputStyle={inputStyle}
            />
          </div>
          {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full font-bold py-3 rounded-xl transition-opacity"
            style={{ background: '#4D10C8', color: '#fff', opacity: loading ? 0.6 : 1, fontSize: '1rem', marginTop: '0.25rem' }}
          >
            {loading ? 'Saving…' : 'Set new password →'}
          </button>
        </div>
      </div>
    </main>
  );
}
