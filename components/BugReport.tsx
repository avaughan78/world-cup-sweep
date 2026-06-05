'use client';

import { useState } from 'react';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function BugReport() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  function close() {
    setOpen(false);
    // Reset after close animation
    setTimeout(() => { setEmail(''); setDescription(''); setStatus('idle'); }, 300);
  }

  async function handleSubmit() {
    if (!email.trim() || !description.trim()) return;
    setStatus('sending');

    const company_code = localStorage.getItem('company_code') ?? undefined;

    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), description: description.trim(), company_code }),
      });
      setStatus(res.ok ? 'sent' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    padding: '0.65rem 0.85rem',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm transition-opacity hover:opacity-70"
        style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        Report bug / get help
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(8,8,6,0.75)', backdropFilter: 'blur(8px)' }}
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Report bug / get help</h2>
              <button
                onClick={close}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              {status === 'sent' ? (
                <div className="text-center py-6 space-y-2">
                  <p className="text-3xl">✅</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Report sent!</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Thanks — we'll be in touch if we need more info.</p>
                  <button
                    onClick={close}
                    className="mt-4 w-full font-bold py-2.5 rounded-xl"
                    style={{ background: 'var(--border)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Your email <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      maxLength={100}
                      autoFocus
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      Description
                    </label>
                    <textarea
                      placeholder="What went wrong?"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && e.metaKey && handleSubmit()}
                      maxLength={1000}
                      rows={4}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>
                  {status === 'error' && (
                    <p className="text-xs" style={{ color: '#ef4444' }}>Something went wrong — please try again.</p>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={!description.trim() || status === 'sending'}
                    className="w-full font-bold py-2.5 rounded-xl transition-opacity"
                    style={{
                      background: '#4D10C8',
                      color: '#fff',
                      opacity: (!description.trim() || status === 'sending') ? 0.4 : 1,
                      fontSize: '0.95rem',
                    }}
                  >
                    {status === 'sending' ? 'Sending…' : 'Send report →'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
