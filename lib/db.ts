import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default sql;

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

export async function getParticipants(): Promise<Participant[]> {
  const rows = await sql`SELECT team_name, participant_name FROM participants ORDER BY team_name`;
  return rows as Participant[];
}

export async function getParticipantsWithTokens(): Promise<(Participant & { claim_token: string | null })[]> {
  const rows = await sql`SELECT team_name, participant_name, claim_token FROM participants ORDER BY team_name`;
  return rows as (Participant & { claim_token: string | null })[];
}

export async function generateClaimTokens() {
  const rows = await sql`SELECT team_name FROM participants WHERE claim_token IS NULL`;
  for (const row of rows) {
    const token = crypto.randomUUID();
    await sql`UPDATE participants SET claim_token = ${token} WHERE team_name = ${row.team_name}`;
  }
  const all = await sql`SELECT COUNT(*) as n FROM participants WHERE claim_token IS NOT NULL`;
  return Number((all[0] as { n: string }).n);
}

export async function getParticipantByToken(token: string): Promise<(Participant & { claim_token: string }) | null> {
  const rows = await sql`SELECT team_name, participant_name, claim_token FROM participants WHERE claim_token = ${token}`;
  return (rows[0] as (Participant & { claim_token: string })) ?? null;
}

export async function claimTeam(token: string, participantName: string) {
  await sql`
    UPDATE participants SET participant_name = ${participantName}, synced_at = NOW()
    WHERE claim_token = ${token}
  `;
}

export async function adminSetParticipant(teamName: string, participantName: string) {
  await sql`
    UPDATE participants SET participant_name = ${participantName}, synced_at = NOW()
    WHERE team_name = ${teamName}
  `;
}

export async function upsertParticipant(teamName: string, participantName: string | null) {
  await sql`
    INSERT INTO participants (team_name, participant_name, synced_at)
    VALUES (${teamName}, ${participantName}, NOW())
    ON CONFLICT (team_name) DO UPDATE
    SET participant_name = ${participantName}, synced_at = NOW()
  `;
}

export async function getAllTeamStats(): Promise<TeamStats[]> {
  const rows = await sql`SELECT * FROM team_stats`;
  return rows as TeamStats[];
}

export async function upsertTeamStats(stats: {
  team_name: string;
  yellow_cards: number;
  red_cards: number;
  own_goals_against: number;
  is_eliminated: boolean;
  eliminated_at?: string;
}) {
  const eliminatedAt = stats.eliminated_at ?? null;
  await sql`
    INSERT INTO team_stats (team_name, yellow_cards, red_cards, own_goals_against, is_eliminated, eliminated_at, updated_at)
    VALUES (
      ${stats.team_name},
      ${stats.yellow_cards},
      ${stats.red_cards},
      ${stats.own_goals_against},
      ${stats.is_eliminated},
      ${eliminatedAt},
      NOW()
    )
    ON CONFLICT (team_name) DO UPDATE
    SET
      yellow_cards = ${stats.yellow_cards},
      red_cards = ${stats.red_cards},
      own_goals_against = ${stats.own_goals_against},
      is_eliminated = ${stats.is_eliminated},
      eliminated_at = CASE
        WHEN ${eliminatedAt}::timestamptz IS NOT NULL THEN ${eliminatedAt}::timestamptz
        WHEN ${stats.is_eliminated} AND team_stats.eliminated_at IS NULL THEN NOW()
        WHEN NOT ${stats.is_eliminated} THEN NULL
        ELSE team_stats.eliminated_at
      END,
      updated_at = NOW()
  `;
}

export async function getTopScorer(): Promise<TopScorer | null> {
  const rows = await sql`SELECT * FROM top_scorer WHERE id = 1`;
  return (rows[0] as TopScorer) ?? null;
}

export async function setTopScorer(scorer: TopScorer) {
  await sql`
    INSERT INTO top_scorer (id, player_name, team_name, goals, nationality, updated_at)
    VALUES (1, ${scorer.player_name}, ${scorer.team_name}, ${scorer.goals}, ${scorer.nationality}, NOW())
    ON CONFLICT (id) DO UPDATE
    SET player_name = ${scorer.player_name},
        team_name = ${scorer.team_name},
        goals = ${scorer.goals},
        nationality = ${scorer.nationality},
        updated_at = NOW()
  `;
}

export async function getPrizeOverride(category: string): Promise<PrizeOverride | null> {
  const rows = await sql`SELECT * FROM prize_overrides WHERE category = ${category}`;
  return (rows[0] as PrizeOverride) ?? null;
}

export async function setPrizeOverride(override: PrizeOverride) {
  await sql`
    INSERT INTO prize_overrides (category, team_name, value_label, notes, updated_at)
    VALUES (${override.category}, ${override.team_name}, ${override.value_label}, ${override.notes}, NOW())
    ON CONFLICT (category) DO UPDATE
    SET team_name = ${override.team_name},
        value_label = ${override.value_label},
        notes = ${override.notes},
        updated_at = NOW()
  `;
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

export async function getGroupStandings(): Promise<GroupStanding[]> {
  try {
    const rows = await sql`
      SELECT * FROM group_standings ORDER BY group_name, position
    `;
    return rows as GroupStanding[];
  } catch {
    return []; // table may not exist yet
  }
}

export async function upsertGroupStanding(s: GroupStanding) {
  await sql`
    INSERT INTO group_standings
      (group_name, position, team_name, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, updated_at)
    VALUES
      (${s.group_name}, ${s.position}, ${s.team_name}, ${s.played}, ${s.won}, ${s.drawn}, ${s.lost}, ${s.goals_for}, ${s.goals_against}, ${s.goal_difference}, ${s.points}, NOW())
    ON CONFLICT (group_name, team_name) DO UPDATE SET
      position        = ${s.position},
      played          = ${s.played},
      won             = ${s.won},
      drawn           = ${s.drawn},
      lost            = ${s.lost},
      goals_for       = ${s.goals_for},
      goals_against   = ${s.goals_against},
      goal_difference = ${s.goal_difference},
      points          = ${s.points},
      updated_at      = NOW()
  `;
}

export async function resetStatsForNewSeason() {
  await sql`UPDATE participants SET participant_name = NULL, synced_at = NOW()`;
  await sql`UPDATE team_stats SET yellow_cards=0, red_cards=0, own_goals_against=0, is_eliminated=false, eliminated_at=NULL, updated_at=NOW()`;
  await sql`UPDATE group_standings SET played=0, won=0, drawn=0, lost=0, goals_for=0, goals_against=0, goal_difference=0, points=0, updated_at=NOW()`;
  await sql`DELETE FROM top_scorer`;
  await sql`DELETE FROM prize_overrides`;
}

export async function logSync(syncType: string, status: string, message?: string) {
  await sql`
    INSERT INTO sync_log (sync_type, status, message)
    VALUES (${syncType}, ${status}, ${message ?? null})
  `;
}

export async function getLastSync(syncType: string): Promise<string | null> {
  const rows = await sql`
    SELECT created_at FROM sync_log
    WHERE sync_type = ${syncType} AND status = 'success'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return (rows[0]?.created_at as string) ?? null;
}
