'use client';

import { useState, useEffect } from 'react';

export default function SyncTime({ timestamp }: { timestamp: string }) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    setFormatted(isToday ? time : `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} ${time}`);
  }, [timestamp]);

  if (!formatted) return null;
  return <>{formatted}</>;
}
