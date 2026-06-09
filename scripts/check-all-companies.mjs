import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

const companies = await sql`SELECT id, code, name, ticket_price FROM companies ORDER BY id`;
console.log(`Found ${companies.length} companies:\n`);

for (const c of companies) {
  const [s] = await sql`
    SELECT
      COUNT(*)                                                                      AS total,
      COUNT(CASE WHEN participant_name IS NULL            THEN 1 END)               AS null_name,
      COUNT(CASE WHEN participant_name = ''               THEN 1 END)               AS empty_name,
      COUNT(CASE WHEN participant_name IS NOT NULL
                  AND participant_name != ''              THEN 1 END)               AS claimed,
      COUNT(claim_token)                                                             AS has_token
    FROM participants WHERE company_id = ${c.id}
  `;

  const bug = Number(s.empty_name) > 0 ? ' ⚠ EMPTY-STRING BUG' : '';
  console.log(`[${c.id}] ${c.code} — "${c.name}" (ticket £${c.ticket_price ?? '—'})`);
  console.log(`  teams: ${s.total}  |  claimed: ${s.claimed}  |  null: ${s.null_name}  |  empty-str: ${s.empty_name}  |  tokens: ${s.has_token}${bug}`);

  if (Number(s.claimed) > 0) {
    const names = await sql`
      SELECT team_name, participant_name
      FROM participants
      WHERE company_id = ${c.id} AND participant_name IS NOT NULL AND participant_name != ''
      ORDER BY team_name
    `;
    for (const p of names) {
      console.log(`    ${p.team_name.padEnd(28)} → ${p.participant_name}`);
    }
  }
  console.log();
}
