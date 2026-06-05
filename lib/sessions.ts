import crypto from 'crypto';
import sql from './db';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generate(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createAdminSession(): Promise<string> {
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
  const token = generate();
  await sql`
    INSERT INTO sessions (token, type, expires_at)
    VALUES (${token}, 'admin', ${new Date(Date.now() + SESSION_TTL_MS).toISOString()})
  `;
  return token;
}

export async function createManageSession(companyId: number): Promise<string> {
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
  const token = generate();
  await sql`
    INSERT INTO sessions (token, type, company_id, expires_at)
    VALUES (${token}, 'manage', ${companyId}, ${new Date(Date.now() + SESSION_TTL_MS).toISOString()})
  `;
  return token;
}

export async function validateAdminSession(token: string | null | undefined): Promise<boolean> {
  if (!token) return false;
  const rows = await sql`
    SELECT 1 FROM sessions WHERE token = ${token} AND type = 'admin' AND expires_at > NOW()
  `;
  return rows.length > 0;
}

export async function validateManageSession(token: string | null | undefined): Promise<number | null> {
  if (!token) return null;
  const rows = await sql`
    SELECT company_id FROM sessions WHERE token = ${token} AND type = 'manage' AND expires_at > NOW()
  `;
  return rows.length > 0 ? (rows[0].company_id as number) : null;
}

export async function deleteSession(token: string | null | undefined): Promise<void> {
  if (!token) return;
  await sql`DELETE FROM sessions WHERE token = ${token}`;
}

export const ADMIN_COOKIE  = 'admin_session';
export const MANAGE_COOKIE = 'manage_session';
export const COOKIE_OPTS   = 'HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=604800';
