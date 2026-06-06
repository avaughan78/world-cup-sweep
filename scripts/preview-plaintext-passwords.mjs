// Preview which companies still have plaintext (non-bcrypt) passwords.
// Run before the H1 migration: node scripts/preview-plaintext-passwords.mjs
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env'), 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
}

const { neon } = await import('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, code, name,
         LEFT(admin_password, 4) AS pw_prefix,
         LENGTH(admin_password) AS pw_len
  FROM companies
  WHERE admin_password IS NOT NULL
    AND admin_password NOT LIKE '$2%'
  ORDER BY id
`;

if (rows.length === 0) {
  console.log('✅ No plaintext passwords found — all companies are already using bcrypt.');
} else {
  console.log(`⚠️  ${rows.length} company(ies) with plaintext passwords:\n`);
  for (const r of rows) {
    console.log(`  id=${r.id}  code=${r.code}  name="${r.name}"  prefix="${r.pw_prefix}"  len=${r.pw_len}`);
  }
  console.log('\nRun the migrate script to hash these: node scripts/migrate-plaintext-passwords.mjs');
}
