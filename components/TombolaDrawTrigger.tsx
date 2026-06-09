'use client';

import { useState } from 'react';
import type { Company } from '@/lib/db';
import TombolaModal from './TombolaModal';

export default function TombolaDrawTrigger({ company }: { company: Company }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 font-bold px-4 py-2 rounded-xl text-sm"
        style={{ background: '#4D10C8', color: '#fff', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}
      >
        🎩 Draw a team
      </button>
      {open && <TombolaModal company={company} onClose={() => setOpen(false)} />}
    </>
  );
}
