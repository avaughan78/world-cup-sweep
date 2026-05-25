import { getAllTeamStats, getTopScorer, getPrizeOverride, TeamStats } from './db';
import type { ApiMatch, ApiStanding } from './football-api';
import { normaliseTeamName } from './football-api';

export interface Prize {
  slug: string;
  name: string;
  description: string;
  icon: string;
  current_team: string | null;
  current_participant: string | null;
  value_label: string | null;
  is_manual: boolean;
  mystery?: boolean;
  hidden?: boolean;
  video_url?: string | null;
}

export async function computePrizes(
  participantMap: Map<string, string | null>,
  companyId: number
): Promise<Prize[]> {
  const [allStats, topScorer, shotOverride, bicycleOverride, ownGoalOverride] = await Promise.all([
    getAllTeamStats(),
    getTopScorer(),
    getPrizeOverride(companyId, 'longest_shot'),
    getPrizeOverride(companyId, 'bicycle'),
    getPrizeOverride(companyId, 'most_own_goals'),
  ]);

  function participant(teamName: string | null): string | null {
    if (!teamName) return null;
    return participantMap.get(teamName) ?? participantMap.get(teamName.toLowerCase()) ?? null;
  }

  // 1. Most cards (yellow + red×2 weighted)
  let topCards: TeamStats | null = null;
  for (const t of allStats) {
    const score = t.yellow_cards + t.red_cards * 2;
    const bestScore = topCards ? topCards.yellow_cards + topCards.red_cards * 2 : -1;
    if (score > bestScore) topCards = t;
  }
  const topCardsTotal = topCards ? topCards.yellow_cards + topCards.red_cards * 2 : 0;

  // 2. First eliminated
  const firstOut = allStats
    .filter(t => t.is_eliminated && t.eliminated_at)
    .sort((a, b) => new Date(a.eliminated_at!).getTime() - new Date(b.eliminated_at!).getTime())[0] ?? null;

  // 4. Most own goals
  let topOGs: TeamStats | null = null;
  for (const t of allStats) {
    if (!topOGs || t.own_goals_against > topOGs.own_goals_against) topOGs = t;
  }

  // 5. Top scorer's team
  const topScorerTeam = topScorer?.team_name ?? null;

  // 6. Most goals conceded (The Sieve) — all matches via team_stats.goals_conceded
  let topSieve: TeamStats | null = null;
  for (const t of allStats) {
    if (!topSieve || t.goals_conceded > topSieve.goals_conceded) topSieve = t;
  }

  return [
    {
      slug: 'most_cards',
      name: 'The Gareth Barry Award',
      description: 'Filthiest team (yellow + red cards)',
      icon: '🟨',
      current_team: topCardsTotal > 0 ? topCards!.team_name : null,
      current_participant: topCardsTotal > 0 ? participant(topCards!.team_name) : null,
      value_label: topCardsTotal > 0
        ? `${topCards!.yellow_cards + topCards!.red_cards} cards`
        : null,
      is_manual: false,
    },
    {
      slug: 'first_eliminated',
      name: 'Early Bath',
      description: 'The first team eliminated',
      icon: '✈️',
      current_team: firstOut?.team_name ?? null,
      current_participant: participant(firstOut?.team_name ?? null),
      value_label: firstOut?.eliminated_at
        ? `Eliminated · ${new Date(firstOut.eliminated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
        : null,
      is_manual: false,
    },
    {
      slug: 'longest_shot',
      name: 'The Thunderbastard',
      description: "The longest range goal",
      icon: '🚀',
      current_team: shotOverride?.team_name ?? null,
      current_participant: participant(shotOverride?.team_name ?? null),
      value_label: shotOverride?.value_label ?? null,
      is_manual: true,
      video_url: shotOverride?.notes ?? null,
    },
    {
      slug: 'most_own_goals',
      name: 'Oooops',
      description: 'The team conceding the most spectacular own goal',
      icon: '😬',
      current_team: ownGoalOverride?.team_name && ownGoalOverride.team_name !== '__hidden__' ? ownGoalOverride.team_name : null,
      current_participant: ownGoalOverride?.team_name && ownGoalOverride.team_name !== '__hidden__' ? participant(ownGoalOverride.team_name) : null,
      value_label: ownGoalOverride?.team_name !== '__hidden__' ? (ownGoalOverride?.value_label ?? null) : null,
      is_manual: true,
      mystery: true,
      hidden: ownGoalOverride?.team_name === '__hidden__',
      video_url: ownGoalOverride?.team_name !== '__hidden__' ? (ownGoalOverride?.notes ?? null) : null,
    },
    {
      slug: 'top_scorer_team',
      name: 'The Golden Boot',
      description: "The tournament's top scorer",
      icon: '👟',
      current_team: topScorerTeam,
      current_participant: participant(topScorerTeam),
      value_label: topScorer?.player_name
        ? `${topScorer.player_name} · ${topScorer.goals} goal${topScorer.goals !== 1 ? 's' : ''}`
        : null,
      is_manual: false,
    },
    {
      slug: 'bicycle',
      name: 'The Bicycle',
      description: 'Best overhead kick of the tournament',
      icon: '🤸',
      current_team: bicycleOverride?.team_name && bicycleOverride.team_name !== '__hidden__' ? bicycleOverride.team_name : null,
      current_participant: bicycleOverride?.team_name && bicycleOverride.team_name !== '__hidden__' ? participant(bicycleOverride.team_name) : null,
      value_label: bicycleOverride?.team_name !== '__hidden__' ? (bicycleOverride?.value_label ?? null) : null,
      is_manual: true,
      mystery: true,
      hidden: bicycleOverride?.team_name === '__hidden__',
      video_url: bicycleOverride?.team_name !== '__hidden__' ? (bicycleOverride?.notes ?? null) : null,
    },
    {
      slug: 'sieve',
      name: 'The Sieve',
      description: 'Most goals conceded overall',
      icon: '🪣',
      current_team: (topSieve?.goals_conceded ?? 0) > 0 ? topSieve!.team_name : null,
      current_participant: (topSieve?.goals_conceded ?? 0) > 0 ? participant(topSieve!.team_name) : null,
      value_label: (topSieve?.goals_conceded ?? 0) > 0
        ? `${topSieve!.goals_conceded} conceded`
        : null,
      is_manual: false,
    },
  ];
}

// --- Stat computation helpers (used by sync route) ---

export function computeCardTotals(
  matches: ApiMatch[]
): Map<string, { yellow: number; red: number }> {
  const map = new Map<string, { yellow: number; red: number }>();

  for (const match of matches) {
    if (match.status !== 'FINISHED') continue;
    for (const booking of match.bookings ?? []) {
      const name = normaliseTeamName(booking.team.name);
      const existing = map.get(name) ?? { yellow: 0, red: 0 };
      if (booking.card === 'YELLOW') existing.yellow++;
      else if (booking.card === 'RED' || booking.card === 'YELLOW_RED') existing.red++;
      map.set(name, existing);
    }
  }
  return map;
}

export function computeOwnGoals(matches: ApiMatch[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const match of matches) {
    if (match.status !== 'FINISHED') continue;
    for (const goal of match.goals ?? []) {
      if (goal.type !== 'OWN_GOAL') continue;
      // goal.team = the team that benefits; the conceding team is the other one
      const benefiting = normaliseTeamName(goal.team.name);
      const home = normaliseTeamName(match.homeTeam.name);
      const away = normaliseTeamName(match.awayTeam.name);
      const conceding = benefiting === home ? away : home;
      map.set(conceding, (map.get(conceding) ?? 0) + 1);
    }
  }
  return map;
}

export function computeEliminations(standings: ApiStanding[]): Set<string> {
  const eliminated = new Set<string>();

  // Only process group-stage standings where all 4 teams have played 3 games
  const groupStandings = standings.filter(s => s.type === 'TOTAL' && s.group);

  for (const group of groupStandings) {
    const allPlayed3 = group.table.every(t => t.playedGames >= 3);
    if (!allPlayed3) continue;

    // Bottom team (position 4) is always eliminated.
    // Position 3 may advance via best-3rd-place wildcard — we mark them separately
    // after all groups are complete (handled below).
    const last = group.table[group.table.length - 1];
    if (last) eliminated.add(normaliseTeamName(last.team.name));
  }

  // If all 12 groups are complete, also eliminate worst 4 of the 3rd-place teams
  if (groupStandings.filter(s => s.table.every(t => t.playedGames >= 3)).length === 12) {
    const thirdPlace = groupStandings
      .map(g => g.table[2])
      .filter(Boolean)
      .sort((a, b) => b.points - a.points || b.won - a.won);
    // Bottom 4 third-place teams don't advance
    thirdPlace.slice(8).forEach(t => eliminated.add(normaliseTeamName(t.team.name)));
  }

  return eliminated;
}

export function computeGoalsConceded(matches: ApiMatch[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const match of matches) {
    if (match.status !== 'FINISHED') continue;
    const home = normaliseTeamName(match.homeTeam.name);
    const away = normaliseTeamName(match.awayTeam.name);
    const homeScore = match.score.fullTime.home ?? 0;
    const awayScore = match.score.fullTime.away ?? 0;
    map.set(home, (map.get(home) ?? 0) + awayScore);
    map.set(away, (map.get(away) ?? 0) + homeScore);
  }
  return map;
}
