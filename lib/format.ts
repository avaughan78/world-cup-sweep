export function abbreviateName(name: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function formatSyncTime(dateStr: string): string {
  const date = new Date(dateStr);
  const tz = 'Europe/London';
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz });
  const todayStr = new Date().toLocaleDateString('en-GB', { timeZone: tz });
  const dateStr2 = date.toLocaleDateString('en-GB', { timeZone: tz });
  if (todayStr === dateStr2) return time;
  const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: tz });
  return `${label} ${time}`;
}
