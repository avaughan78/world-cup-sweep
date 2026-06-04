'use client';

export default function HomeExitLink() {
  return (
    <a
      href="/"
      onClick={() => localStorage.removeItem('company_code')}
      aria-label="Leave sweep"
      title="Leave sweep"
      className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
      style={{
        width: '1.75rem', height: '1.75rem',
        background: 'rgba(255,255,255,0.2)',
        border: '1px solid rgba(255,255,255,0.3)',
        color: '#fff',
        flexShrink: 0,
      }}
    >
      {/* Exit / leave icon: arrow pointing out of a box */}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
      </svg>
    </a>
  );
}
