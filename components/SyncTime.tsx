'use client';

export default function SyncTime({ timestamp }: { timestamp: string }) {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  if (isToday) return <>{time}</>;
  const label = date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  return <>{label} {time}</>;
}
