import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import { GROUPS_2026 } from './groups';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

export interface Company {
  id: number;
  code: string;
  name: string;
  ticket_price: number | null;
}

export interface Participant {
  team_name: string;
  participant_name: string | null;
}

export interface TeamStats {
  team_name: string;
  api_team_id: number | null;
  yellow_cards: number;
  red_cards: number;
  own_goals_against: number;
  goals_conceded: number;
  is_eliminated: boolean;
  eliminated_at: string | null;
}

export interface TopScorer {
  player_name: string | null;
  team_name: string | null;
  goals: number;
  nationality: string | null;
}

export interface PrizeOverride {
  category: string;
  team_name: string | null;
  value_label: string | null;
  notes: string | null;
}

export interface GroupStanding {
  group_name: string;
  position: number;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

// ── Companies ────────────────────────────────────────────────────────────────

export async function listCompanies(): Promise<Company[]> {
  const rows = await sql`SELECT id, code, name, ticket_price FROM companies ORDER BY name`;
  return rows as Company[];
}

export async function getCompanyByCode(code: string): Promise<Company | null> {
  const rows = await sql`SELECT id, code, name, ticket_price FROM companies WHERE UPPER(code) = UPPER(${code})`;
  return (rows[0] as Company) ?? null;
}

export async function setCompanyTicketPrice(id: number, price: number | null): Promise<void> {
  await sql`UPDATE companies SET ticket_price = ${price} WHERE id = ${id}`;
}

export async function setCompanyAdminPassword(id: number, password: string | null): Promise<void> {
  const hashed = password ? await bcrypt.hash(password, 12) : null;
  await sql`UPDATE companies SET admin_password = ${hashed} WHERE id = ${id}`;
}

export async function authenticateCompanyAdmin(code: string, password: string): Promise<
  | { ok: true; company: Company }
  | { ok: false; reason: 'not_found' | 'not_configured' | 'wrong_password' }
> {
  const rows = await sql`SELECT id, code, name, ticket_price, admin_password FROM companies WHERE UPPER(code) = UPPER(${code})`;
  if (!rows[0]) return { ok: false, reason: 'not_found' };
  const row = rows[0] as Company & { admin_password: string | null };
  if (!row.admin_password) return { ok: false, reason: 'not_configured' };

  const stored = row.admin_password;
  let valid: boolean;
  if (stored.startsWith('$2')) {
    valid = await bcrypt.compare(password, stored);
  } else {
    // Plaintext legacy password — compare then upgrade to bcrypt
    valid = stored.trim() === password.trim();
    if (valid) {
      const hashed = await bcrypt.hash(password, 12);
      await sql`UPDATE companies SET admin_password = ${hashed} WHERE id = ${row.id}`;
    }
  }

  if (!valid) return { ok: false, reason: 'wrong_password' };
  return { ok: true, company: { id: row.id, code: row.code, name: row.name, ticket_price: row.ticket_price } };
}

export async function createCompany(code: string, name: string): Promise<Company> {
  const rows = await sql`
    INSERT INTO companies (code, name) VALUES (UPPER(${code}), ${name}) RETURNING id, code, name
  `;
  const company = rows[0] as Company;
  // Seed all 48 teams as empty participant slots
  for (const teams of Object.values(GROUPS_2026)) {
    for (const team of teams) {
      await sql`
        INSERT INTO participants (company_id, team_name)
        VALUES (${company.id}, ${team})
        ON CONFLICT (company_id, team_name) DO NOTHING
      `;
    }
  }
  return company;
}

export async function updateCompany(id: number, fields: { name?: string; code?: string }): Promise<Company> {
  if (fields.name !== undefined && fields.code !== undefined) {
    const rows = await sql`UPDATE companies SET name = ${fields.name}, code = UPPER(${fields.code}) WHERE id = ${id} RETURNING id, code, name, ticket_price`;
    return rows[0] as Company;
  } else if (fields.name !== undefined) {
    const rows = await sql`UPDATE companies SET name = ${fields.name} WHERE id = ${id} RETURNING id, code, name, ticket_price`;
    return rows[0] as Company;
  } else if (fields.code !== undefined) {
    const rows = await sql`UPDATE companies SET code = UPPER(${fields.code}) WHERE id = ${id} RETURNING id, code, name, ticket_price`;
    return rows[0] as Company;
  }
  const rows = await sql`SELECT id, code, name, ticket_price FROM companies WHERE id = ${id}`;
  return rows[0] as Company;
}

export async function deleteCompany(id: number): Promise<void> {
  await sql`DELETE FROM prize_overrides WHERE company_id = ${id}`;
  await sql`DELETE FROM participants WHERE company_id = ${id}`;
  await sql`DELETE FROM companies WHERE id = ${id}`;
}

// ── Participants ─────────────────────────────────────────────────────────────

export async function getParticipants(companyId: number): Promise<Participant[]> {
  const rows = await sql`
    SELECT team_name, participant_name FROM participants
    WHERE company_id = ${companyId} ORDER BY team_name
  `;
  return rows as Participant[];
}

export async function getParticipantsWithTokens(companyId: number): Promise<(Participant & { claim_token: string | null })[]> {
  const rows = await sql`
    SELECT team_name, participant_name, claim_token FROM participants
    WHERE company_id = ${companyId} ORDER BY team_name
  `;
  return rows as (Participant & { claim_token: string | null })[];
}

export async function generateClaimTokens(companyId: number) {
  const rows = await sql`
    SELECT team_name FROM participants WHERE company_id = ${companyId} AND claim_token IS NULL
  `;
  for (const row of rows) {
    const token = crypto.randomUUID();
    await sql`
      UPDATE participants SET claim_token = ${token}
      WHERE company_id = ${companyId} AND team_name = ${row.team_name}
    `;
  }
  const all = await sql`
    SELECT COUNT(*) as n FROM participants WHERE company_id = ${companyId} AND claim_token IS NOT NULL
  `;
  return Number((all[0] as { n: string }).n);
}

export async function getParticipantByToken(token: string): Promise<(Participant & { claim_token: string; company_code: string }) | null> {
  const rows = await sql`
    SELECT p.team_name, p.participant_name, p.claim_token, c.code AS company_code
    FROM participants p JOIN companies c ON c.id = p.company_id
    WHERE p.claim_token = ${token}
  `;
  return (rows[0] as (Participant & { claim_token: string; company_code: string })) ?? null;
}

export async function claimTeam(token: string, participantName: string) {
  await sql`
    UPDATE participants SET participant_name = ${participantName}, synced_at = NOW()
    WHERE claim_token = ${token}
  `;
}

export async function adminSetParticipant(companyId: number, teamName: string, participantName: string) {
  await sql`
    UPDATE participants SET participant_name = ${participantName}, synced_at = NOW()
    WHERE company_id = ${companyId} AND team_name = ${teamName}
  `;
}

// ── Team stats (shared across all companies) ──────────────────────────────────

export async function getAllTeamStats(): Promise<TeamStats[]> {
  const rows = await sql`SELECT * FROM team_stats`;
  return rows as TeamStats[];
}

export async function upsertTeamStats(stats: {
  team_name: string;
  yellow_cards: number;
  red_cards: number;
  own_goals_against: number;
  goals_conceded: number;
  is_eliminated: boolean;
  eliminated_at?: string;
}) {
  const eliminatedAt = stats.eliminated_at ?? null;
  await sql`
    INSERT INTO team_stats (team_name, yellow_cards, red_cards, own_goals_against, goals_conceded, is_eliminated, eliminated_at, updated_at)
    VALUES (
      ${stats.team_name}, ${stats.yellow_cards}, ${stats.red_cards}, ${stats.own_goals_against},
      ${stats.goals_conceded}, ${stats.is_eliminated}, ${eliminatedAt}, NOW()
    )
    ON CONFLICT (team_name) DO UPDATE SET
      yellow_cards        = ${stats.yellow_cards},
      red_cards           = ${stats.red_cards},
      own_goals_against   = ${stats.own_goals_against},
      goals_conceded      = ${stats.goals_conceded},
      is_eliminated       = ${stats.is_eliminated},
      eliminated_at = CASE
        WHEN ${eliminatedAt}::timestamptz IS NOT NULL THEN ${eliminatedAt}::timestamptz
        WHEN ${stats.is_eliminated} AND team_stats.eliminated_at IS NULL THEN NOW()
        WHEN NOT ${stats.is_eliminated} THEN NULL
        ELSE team_stats.eliminated_at
      END,
      updated_at = NOW()
  `;
}

// ── Top scorer (shared) ───────────────────────────────────────────────────────

export async function getTopScorer(): Promise<TopScorer | null> {
  const rows = await sql`SELECT * FROM top_scorer WHERE id = 1`;
  return (rows[0] as TopScorer) ?? null;
}

export async function setTopScorer(scorer: TopScorer) {
  await sql`
    INSERT INTO top_scorer (id, player_name, team_name, goals, nationality, updated_at)
    VALUES (1, ${scorer.player_name}, ${scorer.team_name}, ${scorer.goals}, ${scorer.nationality}, NOW())
    ON CONFLICT (id) DO UPDATE SET
      player_name = ${scorer.player_name}, team_name = ${scorer.team_name},
      goals = ${scorer.goals}, nationality = ${scorer.nationality}, updated_at = NOW()
  `;
}

// ── Prize overrides (per company) ─────────────────────────────────────────────

export async function getPrizeOverride(companyId: number, category: string): Promise<PrizeOverride | null> {
  const rows = await sql`
    SELECT category, team_name, value_label, notes FROM prize_overrides
    WHERE company_id = ${companyId} AND category = ${category}
  `;
  return (rows[0] as PrizeOverride) ?? null;
}

export async function setPrizeOverride(companyId: number, override: PrizeOverride) {
  await sql`
    INSERT INTO prize_overrides (company_id, category, team_name, value_label, notes, updated_at)
    VALUES (${companyId}, ${override.category}, ${override.team_name}, ${override.value_label}, ${override.notes}, NOW())
    ON CONFLICT (company_id, category) DO UPDATE SET
      team_name   = ${override.team_name},
      value_label = ${override.value_label},
      notes       = ${override.notes},
      updated_at  = NOW()
  `;
}

// ── Group standings (shared) ──────────────────────────────────────────────────

export async function getGroupStandings(): Promise<GroupStanding[]> {
  try {
    const rows = await sql`SELECT * FROM group_standings ORDER BY group_name, position`;
    return rows as GroupStanding[];
  } catch {
    return [];
  }
}

export async function upsertGroupStanding(s: GroupStanding) {
  await sql`
    INSERT INTO group_standings
      (group_name, position, team_name, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, updated_at)
    VALUES
      (${s.group_name}, ${s.position}, ${s.team_name}, ${s.played}, ${s.won}, ${s.drawn}, ${s.lost},
       ${s.goals_for}, ${s.goals_against}, ${s.goal_difference}, ${s.points}, NOW())
    ON CONFLICT (group_name, team_name) DO UPDATE SET
      position = ${s.position}, played = ${s.played}, won = ${s.won}, drawn = ${s.drawn},
      lost = ${s.lost}, goals_for = ${s.goals_for}, goals_against = ${s.goals_against},
      goal_difference = ${s.goal_difference}, points = ${s.points}, updated_at = NOW()
  `;
}

// ── Reset ─────────────────────────────────────────────────────────────────────

export async function resetCompany(companyId: number) {
  await sql`UPDATE participants SET participant_name = NULL, claim_token = NULL, synced_at = NOW() WHERE company_id = ${companyId}`;
  await sql`DELETE FROM prize_overrides WHERE company_id = ${companyId}`;
}

export async function resetTournamentStats() {
  await sql`DELETE FROM team_stats`;
  await sql`DELETE FROM group_standings`;
  await sql`DELETE FROM top_scorer WHERE id = 1`;
  await sql`DELETE FROM prize_overrides WHERE category IN ('longest_shot', 'most_own_goals', 'bicycle')`;
}

// ── Squad cache (shared) ──────────────────────────────────────────────────────

export interface SquadPlayer {
  player_name: string;
  position: string;
  shirt_number: number | null;
  photo_url: string | null;
  club: string | null;
  club_badge_url: string | null;
}

const SQUAD_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getSquadCache(teamName: string): Promise<SquadPlayer[] | null> {
  try {
    const rows = await sql`
      SELECT player_name, position, shirt_number, photo_url, club, club_badge_url, updated_at
      FROM squad_cache WHERE team_name = ${teamName}
    `;
    if (!rows.length) return null;
    const oldest = rows.reduce<Date>((min, r) => {
      const d = new Date(r.updated_at as string);
      return d < min ? d : min;
    }, new Date(rows[0].updated_at as string));
    if (Date.now() - oldest.getTime() > SQUAD_CACHE_TTL_MS) return null;
    return rows as SquadPlayer[];
  } catch {
    return null;
  }
}

export async function setSquadCache(teamName: string, squad: SquadPlayer[]): Promise<void> {
  if (!squad.length) return;
  try {
    await sql`DELETE FROM squad_cache WHERE team_name = ${teamName}`;
    for (const p of squad) {
      await sql`
        INSERT INTO squad_cache (team_name, player_name, position, shirt_number, photo_url, club, club_badge_url, updated_at)
        VALUES (${teamName}, ${p.player_name}, ${p.position}, ${p.shirt_number}, ${p.photo_url}, ${p.club}, ${p.club_badge_url}, NOW())
      `;
    }
  } catch (err) {
    console.error('[squad_cache] write error:', err);
  }
}

// ── Sync log (shared) ─────────────────────────────────────────────────────────

export async function logSync(syncType: string, status: string, message?: string) {
  await sql`INSERT INTO sync_log (sync_type, status, message) VALUES (${syncType}, ${status}, ${message ?? null})`;
}

export async function getLastSync(syncType: string): Promise<string | null> {
  const rows = await sql`
    SELECT created_at FROM sync_log
    WHERE sync_type = ${syncType} AND status = 'success'
    ORDER BY created_at DESC LIMIT 1
  `;
  return (rows[0]?.created_at as string) ?? null;
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: number;
  event: string;
  actor: string | null;
  company_id: number | null;
  company_name: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
}

export async function listAuditLogs(limit = 200): Promise<AuditEntry[]> {
  const rows = await sql`
    SELECT a.id, a.event, a.actor, a.company_id, c.name AS company_name, a.details, a.ip, a.created_at
    FROM audit_log a
    LEFT JOIN companies c ON c.id = a.company_id
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `;
  return rows as AuditEntry[];
}
