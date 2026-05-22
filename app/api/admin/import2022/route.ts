import { NextRequest, NextResponse } from 'next/server';
import { scrapeSquadMiscStats, scrapeTopScorer } from '@/lib/fbref';
import { upsertTeamStats, setTopScorer, logSync } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const notes: string[] = [];

  // Cards + own goals from FBRef squad misc stats
  try {
    const { cards, ownGoals } = await scrapeSquadMiscStats('2022');

    for (const [teamName, c] of cards) {
      await upsertTeamStats({
        team_name: teamName,
        yellow_cards: c.yellow,
        red_cards: c.red,
        own_goals_against: ownGoals.get(teamName) ?? 0,
        is_eliminated: true, // All 2022 teams except Argentina are now eliminated
      });
    }

    // Argentina won — mark as not eliminated
    await upsertTeamStats({
      team_name: 'Argentina',
      yellow_cards: cards.get('Argentina')?.yellow ?? 0,
      red_cards: cards.get('Argentina')?.red ?? 0,
      own_goals_against: ownGoals.get('Argentina') ?? 0,
      is_eliminated: false,
    });

    notes.push(`cards: ${cards.size} teams scraped from FBRef`);

    const ogTeams = [...ownGoals.entries()].map(([t, n]) => `${t} (${n})`).join(', ');
    if (ogTeams) notes.push(`own goals: ${ogTeams}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    notes.push(`cards/OGs failed: ${msg}`);
  }

  // Top scorer from FBRef player stats
  try {
    const top = await scrapeTopScorer('2022');
    if (top) {
      await setTopScorer({
        player_name: top.playerName,
        team_name: top.teamName,
        goals: top.goals,
        nationality: top.nationality,
      });
      notes.push(`top scorer: ${top.playerName} (${top.teamName}, ${top.goals} goals)`);
    } else {
      notes.push('top scorer: not found in FBRef table');
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    notes.push(`top scorer failed: ${msg}`);
  }

  // Mark Qatar as first eliminated (known from 2022 tournament)
  try {
    await upsertTeamStats({
      team_name: 'Qatar',
      yellow_cards: 1,
      red_cards: 0,
      own_goals_against: 0,
      is_eliminated: true,
      eliminated_at: '2022-11-25T22:00:00Z',
    });
    notes.push('Qatar marked as first eliminated (25 Nov 2022)');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    notes.push(`Qatar update failed: ${msg}`);
  }

  try {
    await logSync('stats', 'success', notes.join(' | '));
  } catch {
    // non-fatal
  }

  return NextResponse.json({ ok: true, notes });
}
