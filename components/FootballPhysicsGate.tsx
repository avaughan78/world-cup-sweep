'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import FootballPhysics from './FootballPhysics';

function Gate() {
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  // Hide only on the bare landing page (/ with no code) — show everywhere else
  if (pathname === '/' && !searchParams.get('code')) return null;
  return <FootballPhysics />;
}

export default function FootballPhysicsGate() {
  return (
    <Suspense>
      <Gate />
    </Suspense>
  );
}
