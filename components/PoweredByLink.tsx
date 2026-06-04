'use client';

export default function PoweredByLink() {
  return (
    <a
      href="/"
      onClick={() => localStorage.removeItem('company_code')}
      className="text-xs font-semibold"
      style={{ color: 'var(--text-muted)', textDecoration: 'none', opacity: 0.6 }}
    >
      Powered by WC26 Sweep
    </a>
  );
}
