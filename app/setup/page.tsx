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
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPw, setAdminPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [tombolaEnabled, setTombolaEnabled] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleNameChange(val: string) {
    setCompanyName(val);
    if (!codeTouched) setCode(suggestCode(val));
  }

  async function handleCreate() {
    if (!adminPw.trim()) { setError('Please set an admin password.'); return; }
    if (adminPw.trim() !== confirmPw.trim()) { setError('Passwords do not match.'); return; }
    const parsedPrice = ticketPrice.trim() ? parseFloat(ticketPrice) : null;
    if (ticketPrice.trim() && (isNaN(parsedPrice!) || parsedPrice! <= 0)) {
      setError('Ticket price must be a number greater than 0.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/company/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: companyName,
          code,
          admin_password: adminPw,
          admin_email: adminEmail.trim() || null,
          ticket_price: parsedPrice,
          tombola_enabled: tombolaEnabled,
        }),
      });
      const data = await res.json() as { ok?: boolean; error?: string; company?: { code: string } };
      if (data.ok && data.company) {
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
    padding: '0.625rem 0.875rem',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.65rem',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '0.3rem',
    color: 'var(--text-muted)',
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: 580, border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>

        {/* Header — mirrors the main page header style */}
        <div className="px-6 sm:px-8 pt-3 pb-3" style={{
          backgroundImage: 'url(/wc2026-header-bg.png)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
            FIFA World Cup · 2026
          </p>
          <div className="flex items-end gap-4 mt-1">
            <img
              src="/world-cup-trophy.webp"
              alt=""
              style={{ width: 56, height: 72, objectFit: 'contain', flexShrink: 0 }}
            />
            <h1 className="album-title text-4xl sm:text-6xl font-black tracking-tight" style={{ color: '#fff' }}>
              WC26 Sweep
            </h1>
          </div>
          <p className="text-sm font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Set up your sweep
          </p>
        </div>

        {/* Form — 2-column grid keeps everything on one screen */}
        <div className="px-8 py-6" style={{ background: 'var(--card)' }}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">

            {/* Row 1: name + code */}
            <div>
              <label style={labelStyle}>Company / Group name</label>
              <input
                placeholder="e.g. Acme Corp"
                value={companyName}
                onChange={e => handleNameChange(e.target.value)}
                maxLength={60}
                autoFocus
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Code <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— shared with participants</span></label>
              <input
                placeholder="e.g. ACME26"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); setCodeTouched(true); }}
                maxLength={10}
                style={{ ...inputStyle, letterSpacing: '0.1em', fontWeight: 700 }}
              />
            </div>

            {/* Row 2: email + ticket price */}
            <div>
              <label style={labelStyle}>Email <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional, for recovery</span></label>
              <input
                type="email"
                placeholder="you@example.com"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ticket price <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— optional</span></label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-muted)', pointerEvents: 'none',
                }}>£</span>
                <input
                  type="number"
                  min="0"
                  max="999"
                  step="0.50"
                  placeholder="0.00"
                  value={ticketPrice}
                  onChange={e => { setTicketPrice(e.target.value); setError(''); }}
                  style={{ ...inputStyle, paddingLeft: '1.75rem' }}
                />
              </div>
            </div>

            {/* Row 3: passwords */}
            <div>
              <label style={labelStyle}>Admin password <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— organiser only</span></label>
              <PasswordInput
                value={adminPw}
                onChange={v => { setAdminPw(v); setError(''); }}
                placeholder="e.g. football"
                inputStyle={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Confirm password</label>
              <PasswordInput
                value={confirmPw}
                onChange={v => { setConfirmPw(v); setError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Repeat password"
                inputStyle={inputStyle}
              />
            </div>

            {/* Row 4: tombola toggle — full width */}
            <div
              className="col-span-2"
              style={{
                borderRadius: '0.625rem',
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                padding: '0.75rem 1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
                cursor: 'pointer',
              }}
              onClick={() => setTombolaEnabled(v => !v)}
            >
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.15rem' }}>
                  Remote Lucky Dip
                </p>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Let participants draw their own team via a link
                </p>
              </div>
              <div style={{
                width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                background: tombolaEnabled ? '#4D10C8' : 'var(--border)',
                position: 'relative', transition: 'background 0.18s',
              }}>
                <div style={{
                  position: 'absolute', top: 3, left: tombolaEnabled ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                  transition: 'left 0.18s',
                }} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="col-span-2" style={{ fontSize: '0.875rem', color: '#ef4444', margin: '-0.5rem 0 -0.25rem' }}>
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              className="col-span-2"
              onClick={handleCreate}
              disabled={loading}
              style={{
                background: '#4D10C8', color: '#fff',
                fontWeight: 700, fontSize: '1rem', padding: '0.8125rem',
                borderRadius: '0.75rem', border: 'none', cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating…' : 'Create Draw →'}
            </button>

            {/* Footer link */}
            <p className="col-span-2" style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', marginTop: '-0.25rem' }}>
              Already have a code?{' '}
              <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>Enter it here</a>
            </p>

          </div>
        </div>
      </div>
    </main>
  );
}
