import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const companies = await sql`SELECT id, code, name FROM companies WHERE LOWER(code) LIKE '%xon%' OR LOWER(name) LIKE '%xon%'`;
console.log('Matching companies:', companies);

for (const c of companies) {
  const claimed = await sql`
    SELECT team_name, participant_name, paid, claim_token IS NOT NULL AS has_token
    FROM participants
    WHERE company_id = ${c.id}
    ORDER BY participant_name NULLS LAST, team_name
  `;
  const withName = claimed.filter(p => p.participant_name);
  console.log(`\nCompany "${c.name}" (id=${c.id}, code=${c.code}):`);
  console.log(`  Total teams: ${claimed.length}`);
  console.log(`  Claimed (have a name): ${withName.length}`);
  if (withName.length > 0) {
    console.log('  Claimed entries:');
    for (const p of withName) {
      console.log(`    ${p.team_name.padEnd(20)} → ${p.participant_name}${p.paid ? ' ✓ paid' : ''}`);
    }
  } else {
    console.log('  No claimed entries found.');
  }
}
