import { NextRequest, NextResponse } from 'next/server';
import { getFinishedMatches, getTopScorers, getStandings, normaliseTeamName } from '@/lib/football-api';
import { upsertTeamStats, setTopScorer, logSync, getParticipants, upsertGroupStanding } from '@/lib/db';
import { GROUPS_2026 } from '@/lib/groups';
import { computeCardTotals, computeOwnGoals, computeEliminations } from '@/lib/prizes';

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    const [matches, scorers, standings] = await Promise.all([
      getFinishedMatches(),
      getTopScorers(),
      getStandings(),
    ]);

    const statNotes: string[] = [];

    const cards = computeCardTotals(matches);
    const ownGoals = computeOwnGoals(matches);
    const eliminated = computeEliminations(standings);

    // Build the set of teams seen in matches
    const matchTeams = new Set<string>();
    for (const m of matches) {
      matchTeams.add(normaliseTeamName(m.homeTeam.name));
      matchTeams.add(normaliseTeamName(m.awayTeam.name));
    }

    // Always update ALL participant teams so old-season data gets reset to zero
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

    // Sync group standings table
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
      // Pre-tournament fallback: write all groups with zero stats so the table shows structure
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

  return NextResponse.json({ ok: true, results });
}
