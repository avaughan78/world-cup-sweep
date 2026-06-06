// One-off migration: hash any remaining plaintext admin passwords with bcrypt.
// Safe to re-run — bcrypt hashes start with '$2' and are skipped automatically.
// Usage: node scripts/migrate-plaintext-passwords.mjs
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
const bcrypt = await import('bcryptjs');
const sql = neon(process.env.DATABASE_URL);

const rows = await sql`
  SELECT id, code, name, admin_password
  FROM companies
  WHERE admin_password IS NOT NULL
    AND admin_password NOT LIKE '$2%'
`;

if (rows.length === 0) {
  console.log('✅ Nothing to migrate.');
  process.exit(0);
}

console.log(`Hashing ${rows.length} plaintext password(s)…\n`);
for (const row of rows) {
  const hashed = await bcrypt.hash(row.admin_password, 12);
  await sql`UPDATE companies SET admin_password = ${hashed} WHERE id = ${row.id}`;
  console.log(`  ✅  id=${row.id}  code=${row.code}  name="${row.name}"`);
}
console.log('\nDone. Run preview-plaintext-passwords.mjs to verify.');
