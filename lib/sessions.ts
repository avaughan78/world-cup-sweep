import crypto from 'crypto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type Session =
  | { type: 'admin'; expiresAt: number }
  | { type: 'manage'; companyId: number; expiresAt: number };

const store = new Map<string, Session>();

function prune() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt < now) store.delete(k);
  }
}

function generate(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createAdminSession(): string {
  prune();
  const token = generate();
  store.set(token, { type: 'admin', expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function createManageSession(companyId: number): string {
  prune();
  const token = generate();
  store.set(token, { type: 'manage', companyId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

export function validateAdminSession(token: string | null | undefined): boolean {
  if (!token) return false;
  const s = store.get(token);
  if (!s || s.type !== 'admin' || s.expiresAt < Date.now()) {
    if (s) store.delete(token);
    return false;
  }
  return true;
}

export function validateManageSession(token: string | null | undefined): number | null {
  if (!token) return null;
  const s = store.get(token);
  if (!s || s.type !== 'manage' || s.expiresAt < Date.now()) {
    if (s) store.delete(token);
    return null;
  }
  return s.companyId;
}

export function deleteSession(token: string | null | undefined) {
  if (token) store.delete(token);
}

export const ADMIN_COOKIE = 'admin_session';
export const MANAGE_COOKIE = 'manage_session';
export const COOKIE_OPTS = 'HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800';
