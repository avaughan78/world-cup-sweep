'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import PasswordInput from '@/components/PasswordInput';

function suggestCode(name: string): string {
  const upper = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return (upper.slice(0, 5) + '26').slice(0, 8);
}

export default function SetupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [code, setCode] = useState('');
  const [codeTouched, setCodeTouched] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleNameChange(val: string) {
    setCompanyName(val);
    if (!codeTouched) setCode(suggestCode(val));
  }

  async function handleCreate() {
    if (!adminPw.trim()) { setError('Please set an admin password.'); return; }
    if (adminPw.trim() !== confirmPw.trim()) { setError('Passwords do not match.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/company/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, code, admin_password: adminPw }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; company?: { code: string } };
      if (data.ok && data.company) {
        localStorage.setItem(`manage_pw_${data.company.code}`, adminPw);
        router.replace(`/manage?code=${data.company.code}`);
      } else {
        setError(data.error ?? 'Something went wrong');
      }
    } catch {
      setError('Could not connect');
    }
    setLoading(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    outline: 'none',
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

        {/* Branded header */}
        <div className="px-7 pt-7 pb-6" style={{
          backgroundImage: 'url(/wc2026-header-bg.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
            FIFA World Cup · 2026
          </p>
          <h1 className="album-title text-5xl font-black tracking-tight mt-1" style={{ color: '#fff', lineHeight: 1 }}>
            The Draw
          </h1>
          <p className="text-sm mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Set up your tracker
          </p>
        </div>

        {/* Form */}
        <div className="px-7 py-6 space-y-3" style={{ background: 'var(--card)' }}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Company / Group Name
            </label>
            <input
              placeholder="e.g. Acme Corp"
              value={companyName}
              onChange={e => handleNameChange(e.target.value)}
              autoFocus
              style={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Code <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— shared with participants</span>
            </label>
            <input
              placeholder="e.g. ACME26"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setCodeTouched(true); }}
              style={{ ...inputStyle, letterSpacing: '0.1em', fontWeight: 700 }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Admin Password <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— for the organiser only</span>
            </label>
            <PasswordInput
              value={adminPw}
              onChange={v => { setAdminPw(v); setError(''); }}
              placeholder="e.g. football"
              inputStyle={inputStyle}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Confirm Password
            </label>
            <PasswordInput
              value={confirmPw}
              onChange={v => { setConfirmPw(v); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Repeat password"
              inputStyle={inputStyle}
            />
          </div>

          {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

          <button
            onClick={handleCreate}
            disabled={loading}
            className="w-full font-bold py-3 rounded-xl transition-opacity"
            style={{ background: '#4D10C8', color: '#fff', opacity: loading ? 0.6 : 1, fontSize: '1rem', marginTop: '0.25rem' }}
          >
            {loading ? 'Creating…' : 'Create Draw →'}
          </button>

          <p className="text-xs text-center pt-1" style={{ color: 'var(--text-muted)' }}>
            Already have a code?{' '}
            <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Enter it here</a>
          </p>
        </div>
      </div>
    </main>
  );
}
