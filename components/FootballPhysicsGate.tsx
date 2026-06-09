'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import FootballPhysics from './FootballPhysics';

function Gate() {
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  // Hide on the bare landing page and the company creation/setup page
  if (pathname === '/' && !searchParams.get('code')) return null;
  if (pathname === '/setup') return null;
  return <FootballPhysics />;
}

export default function FootballPhysicsGate() {
  return (
    <Suspense>
      <Gate />
    </Suspense>
  );
}
