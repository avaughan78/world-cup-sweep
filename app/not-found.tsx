export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--border)', boxShadow: '0 24px 80px rgba(0,0,0,0.12)' }}
      >
        <div
          className="px-7 pt-6 pb-5"
          style={{
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.65)' }}>
            FIFA World Cup · 2026
          </p>
          <h1 className="album-title text-4xl font-black tracking-tight mt-1" style={{ color: '#fff', lineHeight: 1 }}>
            404
          </h1>
          <p className="text-sm mt-1 font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Page not found
          </p>
        </div>
        <div className="px-7 py-6" style={{ background: 'var(--card)' }}>
          <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
            That page doesn&apos;t exist. Head back to the draw or set up your own sweepstake.
          </p>
          <a
            href="/"
            className="block w-full text-center font-bold py-3 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: '#4D10C8', color: '#fff', fontSize: '1rem' }}
          >
            Go to The Draw →
          </a>
        </div>
      </div>
    </main>
  );
}
