import { revalidateTag } from 'next/cache';
import { getFinishedMatches, getTopScorers, getStandings, normaliseTeamName } from './football-api';
import {
  getAllWCFixtures, getFixtureEvents, getWCTopScorers, mapRound,
} from './api-football';
import type { WCFixture } from './api-football';
import sql, { upsertTeamStats, setTopScorer, logSync, upsertGroupStanding, setPlayerGoals, getPlayerGoals, getProcessedFixtureIds, markFixtureProcessed } from './db';
import type { GroupStanding, PlayerGoal } from './db';
import { GROUPS_2026 } from './groups';
import { computeCardTotals, computeOwnGoals, computeGoalsConceded, computeEliminations } from './prizes';

const LIVE_STATUSES = new Set(['1H', 'HT', '2H', 'ET', 'P', 'LIVE', 'BT', 'SUSP', 'INT']);
const DONE_STATUSES = new Set(['FT', 'AET', 'PEN']);

// ── NBC Sports golden boot scraper ───────────────────────────────────────────

const NBC_SCORER_URL = 'https://www.nbcsports.com/soccer/news/2026-world-cup-top-goalscorers-full-list-latest-on-race-for-the-golden-boot';

// Country names as written by NBC Sports → our canonical team names
const NBC_COUNTRY_MAP: Record<string, string> = {
  'usa': 'United States',
  'united states': 'United States',
  'south korea': 'South Korea',
  'korea': 'South Korea',
  'czechia': 'Czechia',
  'czech republic': 'Czechia',
  'bosnia & herzegovina': 'Bosnia and Herzegovina',
  'bosnia and herzegovina': 'Bosnia and Herzegovina',
  'curacao': 'Curaçao',
  "côte d'ivoire": 'Ivory Coast',
  'ivory coast': 'Ivory Coast',
  'dr congo': 'DR Congo',
  'democratic republic of congo': 'DR Congo',
  'cape verde': 'Cape Verde',
  'new zealand': 'New Zealand',
  'saudi arabia': 'Saudi Arabia',
  'türkiye': 'Türkiye',
  'turkey': 'Türkiye',
};

const ALL_TEAM_NAMES = Object.values(GROUPS_2026).flat();

function nbcCountryToTeam(country: string): string | null {
  const lower = country.toLowerCase().trim();
  if (NBC_COUNTRY_MAP[lower]) return NBC_COUNTRY_MAP[lower];
  const direct = ALL_TEAM_NAMES.find(t => t.toLowerCase() === lower);
  return direct ?? null;
}

function parseNBCSportsScorers(html: string): Array<{ playerName: string; teamName: string; goals: number }> {
  // Strip scripts/styles then convert block-level tags to newlines
  const text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<(?:h[1-6]|p|li|tr|div|br)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const scorers: Array<{ playerName: string; teamName: string; goals: number }> = [];
  let currentGoals = 0;

  for (const line of lines) {
    // Section header: "X goals" or "(X goals each)"
    const headerGoals = line.match(/\b(\d+)\s+goals?\b(?:\s+each)?/i);
    if (headerGoals && !line.match(/\([^)]+\)\s*$/)) {
      currentGoals = parseInt(headerGoals[1]);
      continue;
    }

    // Inline format: "Player Name (Country) - 2 goals"
    const inlineMatch = line.match(/^(.+?)\s*\(([^)]+)\)\s*[-–—]\s*(\d+)\s+goals?/i);
    if (inlineMatch) {
      const teamName = nbcCountryToTeam(inlineMatch[2]);
      if (teamName) scorers.push({ playerName: inlineMatch[1].trim(), teamName, goals: parseInt(inlineMatch[3]) });
      continue;
    }

    // Player under a goal-count section: "Player Name (Country)"
    if (currentGoals > 0) {
      const playerMatch = line.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      if (playerMatch) {
        const teamName = nbcCountryToTeam(playerMatch[2]);
        if (teamName) scorers.push({ playerName: playerMatch[1].trim(), teamName, goals: currentGoals });
      }
    }
  }

  return scorers;
}

async function fetchNBCSportsScorers(): Promise<Array<{ playerName: string; teamName: string; goals: number }>> {
  const res = await fetch(NBC_SCORER_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  return parseNBCSportsScorers(html);
}

export async function runSync(): Promise<{ ok: boolean; results: Record<string, string> }> {
  const results: Record<string, string> = {};

  // One-time migration — safe to run repeatedly (no-op if column exists)
  await sql`ALTER TABLE team_stats ADD COLUMN IF NOT EXISTS goals_conceded INTEGER NOT NULL DEFAULT 0`;

  try {
    const statNotes: string[] = [];

    if (process.env.API_FOOTBALL_KEY) {
      // ── Primary path: api-football.com ──────────────────────────────────────
      const [fixturesResult, scorersResult] = await Promise.allSettled([
        getAllWCFixtures(),
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

      // Cards + own goals: fetch events for live matches + any finished match
      // not yet recorded in processed_fixtures. Each finished match is fetched
      // exactly once — the DB protects against resets via GREATEST.
      const processedIds = await getProcessedFixtureIds();
      const needEvents = activeFixtures.filter(f =>
        LIVE_STATUSES.has(f.statusShort) ||
        (DONE_STATUSES.has(f.statusShort) && !processedIds.has(f.id))
      );

      const cards = new Map<string, { yellow: number; red: number }>();
      const ownGoals = new Map<string, number>();
      const playerGoalMap = new Map<string, PlayerGoal>();

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
              ownGoals.set(team, (ownGoals.get(team) ?? 0) + 1);
            } else if (ev.type === 'Goal' && ev.player) {
              const key = `${ev.player}|||${team}`;
              const existing = playerGoalMap.get(key);
              if (existing) {
                existing.goals++;
              } else {
                playerGoalMap.set(key, { player_name: ev.player, team_name: team, goals: 1, nationality: null });
              }
            }
          }
          // Mark finished matches as done — won't be re-fetched on future syncs
          if (DONE_STATUSES.has(f.statusShort)) {
            await markFixtureProcessed(f.id);
          }
        } catch (err) {
          statNotes.push(`events error fixture ${f.id}: ${err instanceof Error ? err.message : err}`);
          // Do NOT mark as processed if fetch failed — retry next sync
        }
      }

      // Eliminations: compute from fixtures (standings API lags)
      const eliminated = computeEliminationsFromFixtures(allFixtures);

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

      // Four-way merge for goal scorers:
      // 1. DB values — accumulated from all previously processed matches (baseline)
      // 2. NBC Sports scraped list — human-curated, updated throughout tournament
      // 3. API top scorers — authoritative historical data but can lag hours
      // 4. Event scorers from this sync — freshest, covers live + newly processed matches
      // For each player, take the highest goal count seen across all four sources.
      const dbScorers = await getPlayerGoals();
      const apiScorers = scorersResult.status === 'fulfilled' ? scorersResult.value : [];
      const eventScorers = [...playerGoalMap.values()];

      let nbcScorers: Array<{ playerName: string; teamName: string; goals: number }> = [];
      try {
        nbcScorers = await fetchNBCSportsScorers();
        statNotes.push(`NBC Sports: ${nbcScorers.length} scorers`);
      } catch (err) {
        statNotes.push(`NBC Sports fetch failed: ${err instanceof Error ? err.message : err}`);
      }

      const mergedScorerMap = new Map<string, PlayerGoal>();

      // Seed from DB (preserves goals from matches not fetched in this sync)
      for (const s of dbScorers) {
        mergedScorerMap.set(`${s.player_name}|||${s.team_name}`, s);
      }
      // Merge NBC Sports scraped list (taking the higher count)
      for (const s of nbcScorers) {
        const key = `${s.playerName}|||${s.teamName}`;
        const existing = mergedScorerMap.get(key);
        if (!existing || s.goals > existing.goals) {
          mergedScorerMap.set(key, existing ? { ...existing, goals: s.goals } : { player_name: s.playerName, team_name: s.teamName, goals: s.goals, nationality: null });
        }
      }
      // Override with API scorers (taking the higher count)
      for (const s of apiScorers) {
        const team = normaliseTeamName(s.teamName);
        const key = `${s.playerName}|||${team}`;
        const existing = mergedScorerMap.get(key);
        if (!existing || s.goals >= existing.goals) {
          mergedScorerMap.set(key, { player_name: s.playerName, team_name: team, goals: s.goals, nationality: s.nationality });
        }
      }
      // Override with fresh event scorers from this sync (taking the higher count)
      for (const e of eventScorers) {
        const key = `${e.player_name}|||${e.team_name}`;
        const existing = mergedScorerMap.get(key);
        if (!existing || e.goals > existing.goals) {
          mergedScorerMap.set(key, existing ? { ...existing, goals: e.goals } : e);
        }
      }

      const scorerSource = [...mergedScorerMap.values()]
        .filter(s => s.goals > 0)
        .sort((a, b) => b.goals - a.goals);

      if (scorerSource.length > 0) {
        const top = scorerSource[0];
        const tiedCount = scorerSource.filter(s => s.goals === top.goals).length;
        const tied = tiedCount > 1;
        await setTopScorer({
          player_name: tied ? `${tiedCount} players tied` : top.player_name,
          team_name: tied ? null : top.team_name,
          goals: top.goals,
          nationality: tied ? null : top.nationality ?? null,
        });
        statNotes.push(`top scorer: ${tied ? `${tiedCount} tied on ${top.goals}` : `${top.player_name} (${top.goals})`}`);
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

// Determine eliminated teams from fixture results (no standings API needed).
function computeEliminationsFromFixtures(fixtures: WCFixture[]): Set<string> {
  const eliminated = new Set<string>();

  // Group stage: compute standings then eliminate 4th-place teams in completed groups
  const standings = computeStandingsFromFixtures(fixtures);
  const byGroup = new Map<string, GroupStanding[]>();
  for (const row of standings) {
    const g = byGroup.get(row.group_name) ?? [];
    g.push(row);
    byGroup.set(row.group_name, g);
  }
  for (const [, rows] of byGroup) {
    const allPlayed3 = rows.every(r => r.played >= 3);
    if (!allPlayed3) continue;
    const last = [...rows].sort((a, b) => a.position - b.position).at(-1);
    if (last) eliminated.add(last.team_name);
  }

  // Knockout rounds: losers are eliminated
  for (const f of fixtures) {
    if (!DONE_STATUSES.has(f.statusShort)) continue;
    const stage = mapRound(f.round);
    if (stage === 'GROUP_STAGE' || stage === 'THIRD_PLACE') continue;
    if (f.homeGoals == null || f.awayGoals == null) continue;
    const home = normaliseTeamName(f.homeTeam);
    const away = normaliseTeamName(f.awayTeam);
    if (f.homeGoals < f.awayGoals) eliminated.add(home);
    else if (f.awayGoals < f.homeGoals) eliminated.add(away);
  }

  return eliminated;
}
