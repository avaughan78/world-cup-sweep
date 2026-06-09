import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// From audit_log — ordered oldest to newest, last claim per team wins on conflict
const claims = [
  { team: 'Norway',                  name: 'Jamie'      },
  { team: 'Algeria',                 name: 'Jamie'      },
  { team: 'Croatia',                 name: 'Conor C'    },
  { team: 'Japan',                   name: 'Conor C'    },
  { team: 'Bosnia and Herzegovina',  name: 'Sam G'      },
  { team: 'Portugal',                name: 'Oscar'      },
  { team: 'Argentina',               name: 'Brad'       },
  { team: 'South Korea',             name: 'Brad'       },
  { team: 'Qatar',                   name: 'Matt Bonner' },
  { team: 'France',                  name: 'Matt Bonner' },
];

console.log('Restoring claims for XON (company_id=2)...\n');

for (const { team, name } of claims) {
  const result = await sql`
    UPDATE participants
    SET participant_name = ${name}, synced_at = NOW()
    WHERE company_id = 2
      AND team_name = ${team}
      AND (participant_name IS NULL OR participant_name = '')
    RETURNING team_name, participant_name
  `;
  if (result.length > 0) {
    console.log(`  ✓ ${team.padEnd(28)} → ${name}`);
  } else {
    console.log(`  ✗ ${team.padEnd(28)} — no row updated (already claimed or team not found)`);
  }
}

// Final summary
const [s] = await sql`
  SELECT COUNT(*) AS total,
         COUNT(CASE WHEN participant_name IS NOT NULL AND participant_name != '' THEN 1 END) AS claimed
  FROM participants WHERE company_id = 2
`;
console.log(`\nDone. ${s.claimed} of ${s.total} teams claimed.`);
