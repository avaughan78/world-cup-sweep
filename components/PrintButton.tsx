'use client';

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="font-bold px-5 py-2 rounded-lg text-sm"
      style={{ background: 'var(--green)', color: '#fff' }}
    >
      Print
    </button>
  );
}
