'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ResetForm() {
  const searchParams = useSearchParams();
  const [code, setCode] = useState(searchParams.get('code')?.toUpperCase() ?? '');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const lookupRef = useRef('');

  useEffect(() => {
    const trimmed = code.trim();
    if (trimmed.length < 3 || trimmed === lookupRef.current) return;
    lookupRef.current = trimmed;
    fetch('/api/company/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: trimmed }),
    })
      .then(r => r.json() as Promise<{ ok: boolean; company?: { name: string } }>)
      .then(data => { if (data.ok && data.company) setCompanyName(data.company.name); else setCompanyName(''); })
      .catch(() => {});
  }, [code]);

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '0.5rem', padding: '0.75rem 1rem',
    color: 'var(--text-primary)', fontSize: '1rem', outline: 'none',
  };

  async function handleSubmit() {
    if (!code.trim() || !email.trim()) { setError('Please enter your sweep code and email address.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/company/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email: email.trim() }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        setSent(true);
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
            FIFA World Cup · 2026{companyName ? ` · ${companyName}` : ''}
          </p>
          <h1 className="album-title text-5xl font-black tracking-tight mt-1" style={{ color: '#fff', lineHeight: 1 }}>
            WC26 Sweep
          </h1>
          <p className="text-sm mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {companyName ? `${companyName} — reset password` : 'Reset password'}
          </p>
        </div>

        <div className="px-7 py-6 space-y-3" style={{ background: 'var(--card)' }}>
          {sent ? (
            <>
              <div className="rounded-xl px-4 py-4 text-sm" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}>
                <p className="font-bold mb-1">Check your inbox</p>
                <p>If that email matches what&apos;s on file, we&apos;ve sent a reset link. It expires in 1 hour.</p>
              </div>
              <p className="text-xs text-center pt-1">
                <a href={`/manage?code=${code}`} style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
                  ← Back to login
                </a>
              </p>
            </>
          ) : (
            <>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Enter your sweep code and the email address you registered with. We&apos;ll send a reset link.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Sweep code
                </label>
                <input
                  placeholder="e.g. ACME26"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  maxLength={10}
                  style={{ ...inputStyle, letterSpacing: '0.1em', fontWeight: 700 }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  style={inputStyle}
                />
              </div>
              {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full font-bold py-3 rounded-xl transition-opacity"
                style={{ background: '#4D10C8', color: '#fff', opacity: loading ? 0.6 : 1, fontSize: '1rem', marginTop: '0.25rem' }}
              >
                {loading ? 'Sending…' : 'Send reset link →'}
              </button>
              <p className="text-xs text-center pt-1">
                <a href={code ? `/manage?code=${code}` : '/'} style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>
                  ← Back to login
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
