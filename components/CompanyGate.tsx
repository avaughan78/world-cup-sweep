'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompanyGate({ invalidCode = false }: { invalidCode?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (invalidCode) {
      localStorage.removeItem('company_code');
      setError('Company code not recognised');
      setChecking(false);
      return;
    }
    const stored = localStorage.getItem('company_code');
    if (stored) {
      router.replace(`/?code=${stored}`);
    } else {
      setChecking(false);
    }
  }, [router, invalidCode]);

  async function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/company/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        localStorage.setItem('company_code', trimmed);
        router.replace(`/?code=${trimmed}`);
      } else {
        setError('Company code not recognised');
      }
    } catch {
      setError('Could not connect');
    }
    setLoading(false);
  }

  if (checking) return null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
          FIFA World Cup · 2026
        </p>
        <h1 className="text-3xl font-black tracking-tight mb-6" style={{ color: 'var(--text-primary)' }}>
          Enter your company code
        </h1>
        <input
          type="text"
          placeholder="e.g. ACME26"
          value={code}
          onChange={e => { setCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
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
            letterSpacing: '0.1em',
            fontWeight: 700,
          }}
        />
        {error && <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full font-bold py-3 rounded-xl mt-4 transition-opacity"
          style={{ background: 'var(--green)', color: '#fff', opacity: loading ? 0.5 : 1, fontSize: '1rem' }}
        >
          {loading ? 'Checking…' : 'View My Draw →'}
        </button>
      </div>
    </main>
  );
}
