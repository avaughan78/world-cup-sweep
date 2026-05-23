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
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
      >
        {/* Branded header */}
        <div
          className="px-7 pt-7 pb-6"
          style={{
            backgroundColor: '#4D10C8',
            backgroundImage: 'url(/wc2026-header.webp)',
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
          }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: 'rgba(255,255,255,0.65)' }}
          >
            FIFA World Cup · 2026
          </p>
          <h1
            className="album-title text-5xl font-black tracking-tight mt-1"
            style={{ color: '#fff', lineHeight: 1 }}
          >
            The Draw
          </h1>
          <p className="text-sm mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Office Sweepstake
          </p>
        </div>

        {/* Form */}
        <div className="px-7 py-6" style={{ background: 'var(--card)' }}>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Enter your company code to view the draw.
          </p>
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
              border: `1px solid ${error ? '#ef4444' : 'var(--border)'}`,
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              outline: 'none',
              textAlign: 'center',
              letterSpacing: '0.12em',
              fontWeight: 700,
            }}
          />
          {error && (
            <p className="text-sm mt-2" style={{ color: '#ef4444' }}>{error}</p>
          )}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full font-bold py-3 rounded-xl mt-3 transition-opacity"
            style={{ background: '#4D10C8', color: '#fff', opacity: loading ? 0.6 : 1, fontSize: '1rem' }}
          >
            {loading ? 'Checking…' : 'View the Draw →'}
          </button>
        </div>
      </div>
    </main>
  );
}
