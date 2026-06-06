'use client';

import { usePathname } from 'next/navigation';
import FootballPhysics from './FootballPhysics';

export default function FootballPhysicsGate() {
  const pathname = usePathname();
  if (pathname === '/') return null;
  return <FootballPhysics />;
}
