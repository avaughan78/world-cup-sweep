import { getFinishedMatches, getTopScorers, getStandings, normaliseTeamName } from './football-api';
import { upsertTeamStats, setTopScorer, logSync, getParticipants, upsertGroupStanding } from './db';
import { GROUPS_2026 } from './groups';
import { computeCardTotals, computeOwnGoals, computeEliminations } from './prizes';

export async function runSync(): Promise<{ ok: boolean; results: Record<string, string> }> {
  const results: Record<string, string> = {};

  try {
    const statNotes: string[] = [];

    const [matchesResult, scorersResult, standingsResult] = await Promise.allSettled([
      getFinishedMatches(),
      getTopScorers(),
      getStandings(),
    ]);

    const matches = matchesResult.status === 'fulfilled' ? matchesResult.value : [];
    const scorers = scorersResult.status === 'fulfilled' ? scorersResult.value : [];
    const standings = standingsResult.status === 'fulfilled' ? standingsResult.value : [];

    if (matchesResult.status === 'rejected') statNotes.push(`matches error: ${matchesResult.reason}`);
    if (scorersResult.status === 'rejected') statNotes.push(`scorers error: ${scorersResult.reason}`);
    if (standingsResult.status === 'rejected') statNotes.push(`standings error: ${standingsResult.reason}`);

    const cards = computeCardTotals(matches);
    const ownGoals = computeOwnGoals(matches);
    const eliminated = computeEliminations(standings);

    const matchTeams = new Set<string>();
    for (const m of matches) {
      matchTeams.add(normaliseTeamName(m.homeTeam.name));
      matchTeams.add(normaliseTeamName(m.awayTeam.name));
    }

    const participants = await getParticipants();
    const allTeams = new Set([...matchTeams, ...participants.map(p => p.team_name)]);

    for (const teamName of allTeams) {
      const c = cards.get(teamName) ?? { yellow: 0, red: 0 };
      await upsertTeamStats({
        team_name: teamName,
        yellow_cards: c.yellow,
        red_cards: c.red,
        own_goals_against: ownGoals.get(teamName) ?? 0,
        is_eliminated: eliminated.has(teamName),
      });
    }
    statNotes.push(`${matches.length} matches, ${allTeams.size} teams reset`);

    if (scorers.length > 0) {
      const top = scorers[0];
      await setTopScorer({
        player_name: top.player.name,
        team_name: normaliseTeamName(top.team.name),
        goals: top.goals,
        nationality: top.player.nationality,
      });
      statNotes.push(`top scorer: ${top.player.name} (${top.goals})`);
    } else {
      statNotes.push('scorers: unavailable');
    }

    if (standings.length === 0) statNotes.push('standings: unavailable (eliminations not updated)');

    const apiGroups = standings.filter(s => s.type === 'TOTAL' && s.group);
    if (apiGroups.length > 0) {
      for (const g of apiGroups) {
        const letter = (g.group ?? '').replace('GROUP_', '');
        for (const row of g.table) {
          await upsertGroupStanding({
            group_name: letter,
            position: row.position,
            team_name: normaliseTeamName(row.team.name),
            played: row.playedGames,
            won: row.won,
            drawn: row.draw,
            lost: row.lost,
            goals_for: row.goalsFor ?? 0,
            goals_against: row.goalsAgainst ?? 0,
            goal_difference: row.goalDifference ?? 0,
            points: row.points,
          });
        }
      }
      statNotes.push(`group standings: ${apiGroups.length} groups saved`);
    } else {
      for (const [letter, teams] of Object.entries(GROUPS_2026)) {
        for (let i = 0; i < teams.length; i++) {
          await upsertGroupStanding({
            group_name: letter,
            position: i + 1,
            team_name: teams[i],
            played: 0, won: 0, drawn: 0, lost: 0,
            goals_for: 0, goals_against: 0, goal_difference: 0, points: 0,
          });
        }
      }
      statNotes.push('group standings: initialised from draw (no matches yet)');
    }

    await logSync('stats', 'success', statNotes.join(', '));
    results.stats = `ok (${statNotes.join(' · ')})`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('stats', 'error', msg);
    results.stats = `error: ${msg}`;
  }

  return { ok: true, results };
}
