import { NextRequest, NextResponse } from 'next/server';
import { upsertTeamStats, setTopScorer, logSync } from '@/lib/db';

// Approximate 2022 Qatar World Cup stats for UI testing.
// Cards dominated by Netherlands/Argentina quarterfinal (17 cards in one match).
// Qatar was eliminated first (lost all 3 group games, 0 points).
// Canada conceded 2 own goals in the group stage.
// Mbappé (France) was Golden Boot with 8 goals.
const SEED_STATS: Array<{
  team_name: string;
  yellow_cards: number;
  red_cards: number;
  own_goals_against: number;
  is_eliminated: boolean;
  eliminated_at?: string;
}> = [
  { team_name: 'Netherlands', yellow_cards: 14, red_cards: 2, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-09T22:00:00Z' },
  { team_name: 'Argentina',   yellow_cards: 12, red_cards: 1, own_goals_against: 0, is_eliminated: false },
  { team_name: 'France',      yellow_cards: 9,  red_cards: 1, own_goals_against: 0, is_eliminated: false },
  { team_name: 'Brazil',      yellow_cards: 8,  red_cards: 1, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-09T18:00:00Z' },
  { team_name: 'England',     yellow_cards: 7,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-10T22:00:00Z' },
  { team_name: 'Croatia',     yellow_cards: 6,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-13T18:00:00Z' },
  { team_name: 'Morocco',     yellow_cards: 6,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-14T18:00:00Z' },
  { team_name: 'Portugal',    yellow_cards: 5,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-10T18:00:00Z' },
  { team_name: 'Canada',      yellow_cards: 4,  red_cards: 0, own_goals_against: 2, is_eliminated: true, eliminated_at: '2022-12-01T00:00:00Z' },
  { team_name: 'Spain',       yellow_cards: 4,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-06T18:00:00Z' },
  { team_name: 'South Korea', yellow_cards: 4,  red_cards: 1, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-09T18:00:00Z' },
  { team_name: 'Japan',       yellow_cards: 4,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-05T18:00:00Z' },
  { team_name: 'Switzerland', yellow_cards: 4,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-06T22:00:00Z' },
  { team_name: 'Senegal',     yellow_cards: 3,  red_cards: 0, own_goals_against: 1, is_eliminated: true, eliminated_at: '2022-12-04T18:00:00Z' },
  { team_name: 'Australia',   yellow_cards: 3,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-09T18:00:00Z' },
  { team_name: 'Mexico',      yellow_cards: 3,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-11-30T00:00:00Z' },
  { team_name: 'United States', yellow_cards: 3, red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-03T22:00:00Z' },
  { team_name: 'Poland',      yellow_cards: 3,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-04T22:00:00Z' },
  { team_name: 'Germany',     yellow_cards: 3,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-01T00:00:00Z' },
  { team_name: 'Ecuador',     yellow_cards: 3,  red_cards: 1, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-11-29T00:00:00Z' },
  { team_name: 'Uruguay',     yellow_cards: 3,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-02T00:00:00Z' },
  { team_name: 'Denmark',     yellow_cards: 2,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-11-30T00:00:00Z' },
  { team_name: 'Belgium',     yellow_cards: 2,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-01T00:00:00Z' },
  { team_name: 'Serbia',      yellow_cards: 2,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-02T00:00:00Z' },
  { team_name: 'Iran',        yellow_cards: 2,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-11-29T00:00:00Z' },
  { team_name: 'Ghana',       yellow_cards: 2,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-02T00:00:00Z' },
  { team_name: 'Cameroon',    yellow_cards: 2,  red_cards: 1, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-02T00:00:00Z' },
  { team_name: 'Türkiye',     yellow_cards: 0,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-11-28T00:00:00Z' },
  { team_name: 'Tunisia',     yellow_cards: 2,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-11-30T00:00:00Z' },
  { team_name: 'Saudi Arabia', yellow_cards: 2, red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-01T00:00:00Z' },
  { team_name: 'Costa Rica',  yellow_cards: 1,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-12-01T00:00:00Z' },
  { team_name: 'Qatar',       yellow_cards: 1,  red_cards: 0, own_goals_against: 0, is_eliminated: true, eliminated_at: '2022-11-25T00:00:00Z' },
];

export async function POST(req: NextRequest) {
  const { password } = await req.json() as { password?: string };

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  for (const stat of SEED_STATS) {
    await upsertTeamStats(stat);
  }

  await setTopScorer({
    player_name: 'Kylian Mbappé',
    team_name: 'France',
    goals: 8,
    nationality: 'France',
  });

  await logSync('stats', 'success', 'seeded with 2022 WC test data');

  return NextResponse.json({
    ok: true,
    message: `Seeded ${SEED_STATS.length} teams. Top scorer: Mbappé (France, 8 goals). First eliminated: Qatar.`,
  });
}
