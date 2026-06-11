import { getFinishedMatches, getTopScorers, getStandings, normaliseTeamName } from './football-api';
import {
  getAllWCFixtures, getFixtureEvents, getWCStandings, getWCTopScorers, mapRound,
} from './api-football';
import sql, { upsertTeamStats, setTopScorer, logSync, upsertGroupStanding } from './db';
import { GROUPS_2026 } from './groups';
import { computeCardTotals, computeOwnGoals, computeGoalsConceded, computeEliminations } from './prizes';

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT', 'SUSP', 'INT']);
const DONE_STATUSES = new Set(['FT', 'AET', 'PEN']);

export async function runSync(): Promise<{ ok: boolean; results: Record<string, string> }> {
  const results: Record<string, string> = {};

  // One-time migration — safe to run repeatedly (no-op if column exists)
  await sql`ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS goals_conceded INTEGER NOT NULL DEFAULT 0`;

  try {
    const statNotes: string[] = [];

    if (process.env.API_FOOTBALL_KEY) {
      // ── Primary path: api-football.com ──────────────────────────────────────
      const [fixturesResult, standingsResult, scorersResult] = await Promise.allSettled([
        getAllWCFixtures(),
        getWCStandings(),
        getWCTopScorers(),
      ]);

      if (fixturesResult.status === 'rejected') throw new Error(`fixtures: ${fixturesResult.reason}`);
      const allFixtures = fixturesResult.value;

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

      // Cards + own goals: fetch events for recently active fixtures
      // Only fetch for: live matches + matches finished within the last 2 days
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      const needEvents = activeFixtures.filter(f =>
        LIVE_STATUSES.has(f.statusShort) ||
        (DONE_STATUSES.has(f.statusShort) && new Date(f.date).getTime() > twoDaysAgo)
      );

      const cards = new Map<string, { yellow: number; red: number }>();
      const ownGoals = new Map<string, number>();

      for (const f of needEvents) {
        try {
          const events = await getFixtureEvents(f.id);
          for (const ev of events) {
            const team = normaliseTeamName(ev.team);
            if (ev.type === 'Card') {
              const c = cards.get(team) ?? { yellow: 0, red: 0 };
              if (ev.detail === 'Yellow Card') c.yellow++;
              else if (ev.detail === 'Red Card' || ev.detail === 'Second Yellow card') c.red++;
              cards.set(team, c);
            } else if (ev.type === 'Goal' && ev.detail === 'Own Goal') {
              // team = the side that conceded the own goal
              ownGoals.set(team, (ownGoals.get(team) ?? 0) + 1);
            }
          }
        } catch (err) {
          statNotes.push(`events error fixture ${f.id}: ${err instanceof Error ? err.message : err}`);
        }
      }

      // Eliminations: use standings to determine who's out after group stage
      const wcStandings = standingsResult.status === 'fulfilled' ? standingsResult.value : [];
      const eliminated = computeEliminationsFromApiFootball(wcStandings, allFixtures);

      // Upsert team_stats for all known teams
      const allTeams = new Set(Object.values(GROUPS_2026).flat());
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
      statNotes.push(`${activeFixtures.length} active fixtures, ${allTeams.size} teams, ${needEvents.length} event fetches`);

      // Top scorer
      const scorers = scorersResult.status === 'fulfilled' ? scorersResult.value : [];
      if (scorers.length > 0) {
        const top = scorers[0];
        const tiedCount = scorers.filter(s => s.goals === top.goals).length;
        const tied = tiedCount > 1;
        await setTopScorer({
          player_name: tied ? `${tiedCount} players tied` : top.playerName,
          team_name: tied ? null : normaliseTeamName(top.teamName),
          goals: top.goals,
          nationality: tied ? null : top.nationality,
        });
        statNotes.push(`top scorer: ${tied ? `${tiedCount} tied on ${top.goals}` : `${top.playerName} (${top.goals})`}`);
      } else {
        statNotes.push('scorers: none yet');
      }

      // Group standings
      if (wcStandings.length > 0) {
        for (const row of wcStandings) {
          const letter = row.groupName.replace('Group ', '');
          await upsertGroupStanding({
            group_name: letter,
            position: row.rank,
            team_name: normaliseTeamName(row.team),
            played: row.played,
            won: row.won,
            drawn: row.drawn,
            lost: row.lost,
            goals_for: row.goalsFor,
            goals_against: row.goalsAgainst,
            goal_difference: row.goalDiff,
            points: row.points,
          });
        }
        statNotes.push(`standings: ${wcStandings.length} rows`);
      } else {
        // Seed with draw order so the table isn't empty before play starts
        for (const [letter, teams] of Object.entries(GROUPS_2026)) {
          for (let i = 0; i < teams.length; i++) {
            await upsertGroupStanding({
              group_name: letter, position: i + 1, team_name: teams[i],
              played: 0, won: 0, drawn: 0, lost: 0,
              goals_for: 0, goals_against: 0, goal_difference: 0, points: 0,
            });
          }
        }
        statNotes.push('standings: initialised from draw');
      }

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

// Determine eliminated teams from api-football.com standings.
// A team is eliminated when all group stage matches are played and they finish 4th,
// or after losing a knockout match.
function computeEliminationsFromApiFootball(
  standings: import('./api-football').WCStandingRow[],
  fixtures: import('./api-football').WCFixture[],
): Set<string> {
  const eliminated = new Set<string>();

  // Group stage: eliminate teams finishing 4th (bottom) once all 6 matches in their group are played
  const groupRows = new Map<string, typeof standings>();
  for (const row of standings) {
    const g = groupRows.get(row.groupName) ?? [];
    g.push(row);
    groupRows.set(row.groupName, g);
  }

  for (const [, rows] of groupRows) {
    const sorted = [...rows].sort((a, b) => a.rank - b.rank);
    const allPlayed3 = sorted.every(r => r.played >= 3);
    if (!allPlayed3) continue;
    const last = sorted[sorted.length - 1];
    if (last) eliminated.add(normaliseTeamName(last.team));
  }

  // Knockout rounds: teams that lost are eliminated
  for (const f of fixtures) {
    if (!DONE_STATUSES.has(f.statusShort)) continue;
    const stage = mapRound(f.round);
    if (stage === 'GROUP_STAGE') continue;
    if (stage === 'THIRD_PLACE') continue; // both teams still playing
    if (f.homeGoals == null || f.awayGoals == null) continue;
    const home = normaliseTeamName(f.homeTeam);
    const away = normaliseTeamName(f.awayTeam);
    if (f.homeGoals < f.awayGoals) eliminated.add(home);
    else if (f.awayGoals < f.homeGoals) eliminated.add(away);
  }

  return eliminated;
}
