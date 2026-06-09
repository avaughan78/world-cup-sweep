'use client';

import type { Company } from '@/lib/db';
import TombolaContent from '@/components/TombolaContent';

export default function DrawPageInner({ company }: { company: Company }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-6" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: '22rem' }}>
        <TombolaContent company={company} />
      </div>
    </main>
  );
}
