import { NextRequest, NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/sheets';
import { getFinishedMatches, getTopScorers, getStandings, normaliseTeamName } from '@/lib/football-api';
import { upsertParticipant, upsertTeamStats, setTopScorer, logSync, getParticipants } from '@/lib/db';
import { computeCardTotals, computeOwnGoals, computeEliminations } from '@/lib/prizes';

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    const rows = await fetchSheetData();
    for (const row of rows) {
      await upsertParticipant(row.team, row.name);
    }
    await logSync('sheets', 'success', `${rows.length} rows`);
    results.sheets = `ok (${rows.length} rows)`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('sheets', 'error', msg);
    results.sheets = `error: ${msg}`;
  }

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

    await logSync('stats', 'success', statNotes.join(', '));
    results.stats = `ok (${statNotes.join(' · ')})`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await logSync('stats', 'error', msg);
    results.stats = `error: ${msg}`;
  }

  return NextResponse.json({ ok: true, results });
}
