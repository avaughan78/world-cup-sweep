'use client';

import { useState } from 'react';

export default function BugReport() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');

  function handleSubmit() {
    const subject = encodeURIComponent('Bug Report — WC Sweep');
    const body = encodeURIComponent(`From: ${email}\n\n${description}`);
    window.location.href = `mailto:avaughan78@gmail.com?subject=${subject}&body=${body}`;
    setOpen(false);
    setEmail('');
    setDescription('');
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
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <h2 className="font-black text-base" style={{ color: 'var(--text-primary)' }}>Report bug / get help</h2>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Your email
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
              <button
                onClick={handleSubmit}
                disabled={!email.trim() || !description.trim()}
                className="w-full font-bold py-2.5 rounded-xl transition-opacity"
                style={{ background: '#4D10C8', color: '#fff', opacity: (!email.trim() || !description.trim()) ? 0.4 : 1, fontSize: '0.95rem' }}
              >
                Send report →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
