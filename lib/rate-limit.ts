const store = new Map<string, number[]>();

function prune(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter(t => now - t < windowMs);
}

// Returns true if the request is allowed, false if rate limited.
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = prune(store.get(key) ?? [], windowMs, now);
  if (recent.length >= max) {
    store.set(key, recent);
    return false;
  }
  recent.push(now);
  store.set(key, recent);
  return true;
}

export function getIp(req: Request): string {
  const fwd = (req.headers as Headers).get('x-forwarded-for');
  return fwd?.split(',')[0]?.trim() ?? 'unknown';
}
