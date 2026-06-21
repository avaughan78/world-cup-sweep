import { revalidateTag } from 'next/cache';
import { getFinishedMatches, getTopScorers, getStandings, normaliseTeamName } from './football-api';
import {
  getAllWCFixtures, getFixtureEvents, mapRound,
} from './api-football';
import type { WCFixture } from './api-football';
import sql, { upsertTeamStats, setTopScorer, logSync, upsertGroupStanding, setPlayerGoals, getProcessedFixtureIds, markFixtureProcessed } from './db';
import type { GroupStanding, PlayerGoal } from './db';
import { GROUPS_2026 } from './groups';
import { computeCardTotals, computeOwnGoals, computeGoalsConceded, computeEliminations } from './prizes';

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT', 'SUSP', 'INT']);
const DONE_STATUSES = new Set(['FT', 'AET', 'PEN']);

// ── FIFA API golden boot ──────────────────────────────────────────────────────

const FIFA_TOPSCORERS_URL = 'https://api.fifa.com/api/v3/topscorers?idCompetition=17&idSeason=285023&count=100';

// FIFA 3-letter country codes → canonical team names
const FIFA_COUNTRY_MAP: Record<string, string> = {
  MEX: 'Mexico',       RSA: 'South Africa',         KOR: 'South Korea',  CZE: 'Czechia',
  CAN: 'Canada',       BIH: 'Bosnia and Herzegovina', QAT: 'Qatar',       SUI: 'Switzerland',
  BRA: 'Brazil',       MAR: 'Morocco',               HAI: 'Haiti',        SCO: 'Scotland',
  USA: 'United States', PAR: 'Paraguay',              AUS: 'Australia',   TUR: 'Türkiye',
  GER: 'Germany',      CUW: 'Curaçao',               CIV: 'Ivory Coast',  ECU: 'Ecuador',
  NED: 'Netherlands',  JPN: 'Japan',                 SWE: 'Sweden',       TUN: 'Tunisia',
  BEL: 'Belgium',      EGY: 'Egypt',                 IRN: 'Iran',         NZL: 'New Zealand',
  ESP: 'Spain',        CPV: 'Cape Verde',             KSA: 'Saudi Arabia', URU: 'Uruguay',
  FRA: 'France',       SEN: 'Senegal',               IRQ: 'Iraq',         NOR: 'Norway',
  ARG: 'Argentina',    ALG: 'Algeria',               AUT: 'Austria',      JOR: 'Jordan',
  POR: 'Portugal',     COD: 'DR Congo',              UZB: 'Uzbekistan',   COL: 'Colombia',
  ENG: 'England',      CRO: 'Croatia',               GHA: 'Ghana',        PAN: 'Panama',
};

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

async function fetchFIFAScorers(): Promise<Array<{ playerName: string; teamName: string; goals: number; assists: number }>> {
  const res = await fetch(FIFA_TOPSCORERS_URL, {
    headers: { 'Accept': 'application/json', 'Origin': 'https://www.fifa.com' },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`FIFA API HTTP ${res.status}`);
  const data = await res.json() as {
    Results?: Array<{
      PlayerName: Array<{ Locale: string; Description: string }>;
      IdCountry: string;
      Goals: number;
      Assists: number | null;
    }>;
  };
  const scorers: Array<{ playerName: string; teamName: string; goals: number; assists: number }> = [];
  for (const r of data.Results ?? []) {
    if (!r.Goals) continue;
    const teamName = FIFA_COUNTRY_MAP[r.IdCountry];
    if (!teamName) continue;
    const rawName = r.PlayerName.find(n => n.Locale === 'en-GB')?.Description
      ?? r.PlayerName[0]?.Description ?? '';
    scorers.push({ playerName: toTitleCase(rawName), teamName, goals: r.Goals, assists: r.Assists ?? 0 });
  }
  return scorers;
}

export async function runSync(): Promise<{ ok: boolean; results: Record<string, string> }> {
  const results: Record<string, string> = {};

  // One-time migration — safe to run repeatedly (no-op if column exists)
  await sql`ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS goals_conceded INTEGER NOT NULL DEFAULT 0`;

  try {
    const statNotes: string[] = [];

    if (process.env.API_FOOTBALL_KEY) {
      // ── Primary path: api-football.com ──────────────────────────────────────
      const allFixtures = await getAllWCFixtures();

      const activeFixtures = allFixtures.filter(
        f => LIVE_STATUSES.has(f.statusShort) || DONE_STATUSES.has(f.statusShort)
      );

      // Goals conceded: compute directly from fixture scores (no event calls needed)
      const goalsConceded = new Map<string, number>();
      for (const f of activeFixtures) {
        const home = normaliseTeamName(f.homeTeam);
        const away = normaliseTeamName(f.awayTeam);
        if (f.homeGoals != null) goalsConceded.set(away, (goalsConceded.get(away) ?? 0) + f.homeGoals);
        if (f.awayGoals != null) goalsConceded.set(home, (goalsConceded.get(home) ?? 0) + f.awayGoals);
      }

      // Cards + own goals: only fetch events for newly-finished matches (fetch-once).
      // Live match cards are excluded — they'd be double-counted on every sync since
      // they're not yet in processed_fixtures. Cards update shortly after the final whistle.
      const processedIds = await getProcessedFixtureIds();
      const newlyDone = activeFixtures.filter(f =>
        DONE_STATUSES.has(f.statusShort) && !processedIds.has(f.id)
      );

      // Delta from newly-finished matches only
      const deltaCards = new Map<string, { yellow: number; red: number }>();
      const deltaOG = new Map<string, number>();

      for (const f of newlyDone) {
        try {
          const events = await getFixtureEvents(f.id);
          for (const ev of events) {
            const team = normaliseTeamName(ev.team);
            if (ev.type === 'Card') {
              const c = deltaCards.get(team) ?? { yellow: 0, red: 0 };
              if (ev.detail === 'Yellow Card') c.yellow++;
              else if (ev.detail === 'Red Card' || ev.detail === 'Second Yellow card') c.red++;
              deltaCards.set(team, c);
            } else if (ev.type === 'Goal' && ev.detail === 'Own Goal') {
              deltaOG.set(team, (deltaOG.get(team) ?? 0) + 1);
            }
          }
          await markFixtureProcessed(f.id);
        } catch (err) {
          statNotes.push(`events error fixture ${f.id}: ${err instanceof Error ? err.message : err}`);
          // Do NOT mark as processed if fetch failed — retry next sync
        }
      }

      // Eliminations: compute from fixtures (standings API lags)
      const eliminated = computeEliminationsFromFixtures(allFixtures);

      // Read current accumulated card totals from DB, then add the newly-done delta.
      // This is correct because each finished match's events are fetched exactly once
      // (processed_fixtures guard), so we accumulate correctly across syncs.
      const existingStats = await sql`SELECT team_name, yellow_cards, red_cards, own_goals_against FROM team_stats`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbCards = new Map(existingStats.map((r: any) => [
        r.team_name as string,
        { yellow: (r.yellow_cards as number) ?? 0, red: (r.red_cards as number) ?? 0, og: (r.own_goals_against as number) ?? 0 },
      ]));

      const allTeams = new Set(Object.values(GROUPS_2026).flat());
      for (const teamName of allTeams) {
        const db = dbCards.get(teamName) ?? { yellow: 0, red: 0, og: 0 };
        const delta = deltaCards.get(teamName) ?? { yellow: 0, red: 0 };
        await upsertTeamStats({
          team_name: teamName,
          yellow_cards: db.yellow + delta.yellow,
          red_cards: db.red + delta.red,
          own_goals_against: db.og + (deltaOG.get(teamName) ?? 0),
          goals_conceded: goalsConceded.get(teamName) ?? 0,
          is_eliminated: eliminated.has(teamName),
          eliminated_at: eliminated.get(teamName),
        });
      }
      statNotes.push(`${activeFixtures.length} active fixtures, ${allTeams.size} teams, ${newlyDone.length} event fetches, ${eliminated.size} eliminated`);

      // Goal scorers: FIFA API is the single source of truth.
      // If FIFA returns data we delete all existing rows first (clean replace).
      // If FIFA fails the old rows are left untouched.
      let fifaScorers: Array<{ playerName: string; teamName: string; goals: number; assists: number }> = [];
      try {
        fifaScorers = await fetchFIFAScorers();
        statNotes.push(`FIFA API: ${fifaScorers.length} scorers`);
      } catch (err) {
        statNotes.push(`FIFA API fetch failed: ${err instanceof Error ? err.message : err}`);
      }

      // Sort by goals DESC, then assists DESC (FIFA golden boot tiebreaker)
      const scorerSource: PlayerGoal[] = fifaScorers
        .filter(s => s.goals > 0)
        .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
        .map(s => ({ player_name: s.playerName, team_name: s.teamName, goals: s.goals, assists: s.assists, nationality: null }));

      if (scorerSource.length > 0) {
        // Truncate stale rows before writing — FIFA is the single source so
        // we want a clean replace, not an accumulating upsert.
        await sql`DELETE FROM player_goals`;
        const top = scorerSource[0];
        // True tie requires same goals AND same assists
        const goalTied = scorerSource.filter(s => s.goals === top.goals);
        const trueTiedCount = goalTied.filter(s => s.assists === top.assists).length;
        const tied = trueTiedCount > 1;
        await setTopScorer({
          player_name: tied ? `${trueTiedCount} players tied` : top.player_name,
          team_name: tied ? null : top.team_name,
          goals: top.goals,
          nationality: null,
        });
        const note = tied
          ? `${trueTiedCount} tied on ${top.goals}g/${top.assists}a`
          : `${top.player_name} (${top.goals}g ${top.assists}a)`;
        statNotes.push(`top scorer: ${note}`);
      } else {
        statNotes.push('scorers: none yet');
      }

      // Player goals leaderboard
      await setPlayerGoals(scorerSource);
      statNotes.push(`player goals: ${scorerSource.length} scorers`);

      // Group standings — computed directly from fixture scores (API endpoint lags)
      const computedStandings = computeStandingsFromFixtures(allFixtures);
      for (const row of computedStandings) {
        await upsertGroupStanding(row);
      }
      statNotes.push(`standings: ${computedStandings.length} rows (computed)`);

      revalidateTag('team-stats', {});
      revalidateTag('group-standings', {});
      await logSync('stats', 'success', statNotes.join(', '));
      results.stats = `ok (${statNotes.join(' · ')})`;

    } else {
      // ── Fallback path: football-data.org ────────────────────────────────────
      const [matchesResult, scorersResult, standingsResult] = await Promise.allSettled([
        getFinishedMatches(),
        getTopScorers(),
        getStandings(),
      ]);

      const matches = matchesResult.status === 'fulfilled' ? matchesResult.value : [];
      const scorers = scorersResult.status === 'fulfilled' ? scorersResult.value : [];
      const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : [];

      const cards = computeCardTotals(matches);
      const ownGoals = computeOwnGoals(matches);
      const goalsConceded = computeGoalsConceded(matches);
      const eliminated = computeEliminations(standings);

      const allTeams = new Set([
        ...matches.map(m => normaliseTeamName(m.homeTeam.name)),
        ...matches.map(m => normaliseTeamName(m.awayTeam.name)),
        ...Object.values(GROUPS_2026).flat(),
      ]);

      for (const teamName of allTeams) {
        const c = cards.get(teamName) ?? { yellow: 0, red: 0 };
        await upsertTeamStats({
          team_name: teamName,
          yellow_cards: c.yellow,
          red_cards: c.red,
          own_goals_against: ownGoals.get(teamName) ?? 0,
          goals_conceded: goalsConceded.get(teamName) ?? 0,
          is_eliminated: eliminated.has(teamName),
        });
      }

      if (scorers.length > 0) {
        const top = scorers[0];
        const tiedCount = scorers.filter(s => s.goals === top.goals).length;
        const tied = tiedCount > 1;
        await setTopScorer({
          player_name: tied ? `${tiedCount} players tied` : top.player.name,
          team_name: tied ? null : normaliseTeamName(top.team.name),
          goals: top.goals,
          nationality: tied ? null : top.player.nationality,
        });
      }

      const apiGroups = standings.filter(s => s.type === 'TOTAL' && s.group);
      if (apiGroups.length > 0) {
        for (const g of apiGroups) {
          const letter = (g.group ?? '').replace('GROUP_', '');
          for (const row of g.table) {
            await upsertGroupStanding({
              group_name: letter, position: row.position,
              team_name: normaliseTeamName(row.team.name),
              played: row.playedGames, won: row.won, drawn: row.draw, lost: row.lost,
              goals_for: row.goalsFor ?? 0, goals_against: row.goalsAgainst ?? 0,
              goal_difference: row.goalDifference ?? 0, points: row.points,
            });
          }
        }
      }

      revalidateTag('team-stats', {});
      revalidateTag('group-standings', {});
      await logSync('stats', 'success', `fallback: ${matches.length} finished matches`);
      results.stats = `ok (fallback, ${matches.length} matches)`;
    }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('stats', 'error', msg);
    results.stats = `error: ${msg}`;
  }

  return { ok: true, results };
}

// Compute group standings directly from fixture scores — no API lag.
function computeStandingsFromFixtures(fixtures: WCFixture[]): GroupStanding[] {
  const teamToGroup = new Map<string, string>();
  for (const [letter, teams] of Object.entries(GROUPS_2026)) {
    for (const team of teams) teamToGroup.set(team, letter);
  }

  type Row = GroupStanding;
  const rows = new Map<string, Row>();
  for (const [letter, teams] of Object.entries(GROUPS_2026)) {
    for (const team of teams) {
      rows.set(team, {
        group_name: letter, position: 0, team_name: team,
        played: 0, won: 0, drawn: 0, lost: 0,
        goals_for: 0, goals_against: 0, goal_difference: 0, points: 0,
      });
    }
  }

  for (const f of fixtures) {
    if (!DONE_STATUSES.has(f.statusShort)) continue;
    if (f.homeGoals == null || f.awayGoals == null) continue;
    const home = normaliseTeamName(f.homeTeam);
    const away = normaliseTeamName(f.awayTeam);
    if (mapRound(f.round) !== 'GROUP_STAGE') continue;
    const h = rows.get(home);
    const a = rows.get(away);
    if (!h || !a) continue;
    h.played++; a.played++;
    h.goals_for += f.homeGoals; h.goals_against += f.awayGoals;
    a.goals_for += f.awayGoals; a.goals_against += f.homeGoals;
    if (f.homeGoals > f.awayGoals) { h.won++; h.points += 3; a.lost++; }
    else if (f.homeGoals < f.awayGoals) { a.won++; a.points += 3; h.lost++; }
    else { h.drawn++; h.points += 1; a.drawn++; a.points += 1; }
  }

  const byGroup = new Map<string, Row[]>();
  for (const row of rows.values()) {
    row.goal_difference = row.goals_for - row.goals_against;
    const g = byGroup.get(row.group_name) ?? [];
    g.push(row);
    byGroup.set(row.group_name, g);
  }

  const result: Row[] = [];
  for (const group of byGroup.values()) {
    group.sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for);
    group.forEach((r, i) => { r.position = i + 1; });
    result.push(...group);
  }
  return result;
}

// Determine eliminated teams from fixture results, returning each team's elimination
// timestamp so the Early Bath prize reflects the actual match time.
// Detects mathematical 4th-place elimination (can't avoid finishing last even with
// a win) as well as definitive elimination after all 3 group games are played.
function computeEliminationsFromFixtures(fixtures: WCFixture[]): Map<string, string> {
  const eliminated = new Map<string, string>(); // team → ISO eliminated_at

  const teamToGroup = new Map<string, string>();
  for (const [letter, teams] of Object.entries(GROUPS_2026)) {
    for (const team of teams) teamToGroup.set(team, letter);
  }

  // Running per-team group-stage stats (accumulated in match order)
  type Stat = { played: number; points: number; gf: number; ga: number };
  const runningStats = new Map<string, Stat>();
  for (const teams of Object.values(GROUPS_2026)) {
    for (const team of teams) runningStats.set(team, { played: 0, points: 0, gf: 0, ga: 0 });
  }

  // Process group matches chronologically — update running totals, then check elimination
  const groupDone = fixtures
    .filter(f => DONE_STATUSES.has(f.statusShort) && mapRound(f.round) === 'GROUP_STAGE'
              && f.homeGoals != null && f.awayGoals != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const f of groupDone) {
    const home = normaliseTeamName(f.homeTeam);
    const away = normaliseTeamName(f.awayTeam);
    const h = runningStats.get(home);
    const a = runningStats.get(away);
    if (!h || !a) continue;

    h.played++; a.played++;
    h.gf += f.homeGoals!; h.ga += f.awayGoals!;
    a.gf += f.awayGoals!; a.ga += f.homeGoals!;
    if      (f.homeGoals! > f.awayGoals!) { h.points += 3; }
    else if (f.awayGoals! > f.homeGoals!) { a.points += 3; }
    else                                  { h.points++;  a.points++; }

    // Check both groups touched by this match
    const affectedGroups = new Set(
      [teamToGroup.get(home), teamToGroup.get(away)].filter(Boolean) as string[]
    );
    for (const letter of affectedGroups) {
      const groupTeams = GROUPS_2026[letter] ?? [];

      for (const team of groupTeams) {
        if (eliminated.has(team)) continue;
        const s = runningStats.get(team)!;
        const remaining = 3 - s.played;
        const maxPossible = s.points + 3 * remaining;

        // Mathematical elimination: 3 other teams each already have more points
        // than this team can ever achieve — they're locked into 4th.
        const teamsAbove = groupTeams.filter(t => t !== team && runningStats.get(t)!.points > maxPossible).length;
        if (teamsAbove >= 3) {
          eliminated.set(team, f.date);
          continue;
        }

        // Definitive: all 4 teams finished, last in group by points/GD/GF
        const allPlayed3 = groupTeams.every(t => (runningStats.get(t)?.played ?? 0) >= 3);
        if (allPlayed3) {
          const sorted = [...groupTeams].sort((ta, tb) => {
            const sa = runningStats.get(ta)!;
            const sb = runningStats.get(tb)!;
            return (sb.points - sa.points) || ((sb.gf - sb.ga) - (sa.gf - sa.ga)) || (sb.gf - sa.gf);
          });
          if (sorted[sorted.length - 1] === team) {
            eliminated.set(team, f.date);
          }
        }
      }
    }
  }

  // Knockout rounds: loser eliminated at match time
  for (const f of fixtures) {
    if (!DONE_STATUSES.has(f.statusShort)) continue;
    const stage = mapRound(f.round);
    if (stage === 'GROUP_STAGE' || stage === 'THIRD_PLACE') continue;
    if (f.homeGoals == null || f.awayGoals == null) continue;
    const home = normaliseTeamName(f.homeTeam);
    const away = normaliseTeamName(f.awayTeam);
    if (f.homeGoals < f.awayGoals) {
      if (!eliminated.has(home)) eliminated.set(home, f.date);
    } else if (f.awayGoals < f.homeGoals) {
      if (!eliminated.has(away)) eliminated.set(away, f.date);
    } else if (f.statusShort === 'PEN' && f.penaltyHome != null && f.penaltyAway != null) {
      if (f.penaltyHome < f.penaltyAway  && !eliminated.has(home)) eliminated.set(home, f.date);
      else if (f.penaltyAway < f.penaltyHome && !eliminated.has(away)) eliminated.set(away, f.date);
    }
  }

  return eliminated;
}
