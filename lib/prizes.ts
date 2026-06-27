import { getAllTeamStats, getTopScorer, getPlayerGoals, getPrizeOverride, TeamStats, GroupStanding } from './db';
import type { ApiMatch, ApiStanding } from './football-api';
import { normaliseTeamName } from './football-api';

export interface Prize {
  slug: string;
  name: string;
  description: string;
  icon: string;
  current_team: string | null;
  current_participant: string | null;
  tied_players?: { player_name: string; team_name: string }[] | null;
  value_label: string | null;
  player_name?: string | null;
  is_manual: boolean;
  mystery?: boolean;
  hidden?: boolean;
  video_url?: string | null;
  confirmed?: boolean;
}

// 20:00 BST on 19 Jul 2026 = 19:00 UTC
const TOURNAMENT_END = new Date('2026-07-19T19:00:00Z');

export async function computePrizes(
  participantMap: Map<string, string | null>,
  companyId: number,
  groupStandings: GroupStanding[] = []
): Promise<Prize[]> {
  const [allStats, topScorer, playerGoals, shotOverride, bicycleOverride, ownGoalOverride] = await Promise.all([
    getAllTeamStats(),
    getTopScorer(),
    getPlayerGoals(),
    getPrizeOverride(companyId, 'longest_shot'),
    getPrizeOverride(companyId, 'bicycle'),
    getPrizeOverride(companyId, 'most_own_goals'),
  ]);

  const standingsByTeam = new Map(groupStandings.map(s => [s.team_name, s]));

  function participant(teamName: string | null): string | null {
    if (!teamName) return null;
    return participantMap.get(teamName) ?? participantMap.get(teamName.toLowerCase()) ?? null;
  }

  // 1. Most cards (yellow + red×2 weighted); tie-break: most reds, then most yellows
  let topCards: TeamStats | null = null;
  for (const t of allStats) {
    if (!topCards) { topCards = t; continue; }
    const score    = t.yellow_cards + t.red_cards * 2;
    const best     = topCards.yellow_cards + topCards.red_cards * 2;
    if (score > best) { topCards = t; continue; }
    if (score === best && t.red_cards > topCards.red_cards) { topCards = t; continue; }
    if (score === best && t.red_cards === topCards.red_cards && t.yellow_cards > topCards.yellow_cards) topCards = t;
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

  // 5. Top scorer — apply FIFA golden boot tiebreaker: goals first, then assists
  const goldenBootResult = (() => {
    if (!playerGoals.length) return null;
    const maxGoals = playerGoals[0].goals; // sorted by goals DESC, assists DESC
    const goalTied = playerGoals.filter(p => p.goals === maxGoals);
    const maxAssists = Math.max(...goalTied.map(p => p.assists ?? 0));
    const trueTied = goalTied.filter(p => (p.assists ?? 0) === maxAssists);
    return {
      winner: trueTied.length === 1 ? trueTied[0] : null,
      tiedPlayers: trueTied.length > 1 ? trueTied.map(p => ({ player_name: p.player_name, team_name: p.team_name })) : null,
    };
  })();
  const topScorerTeam = goldenBootResult?.winner?.team_name ?? topScorer?.team_name ?? null;
  const goldenBootPlayerName = goldenBootResult?.winner?.player_name ?? topScorer?.player_name ?? null;
  const goldenBootTiedPlayers = goldenBootResult?.tiedPlayers ?? null;

  // 6. Most goals conceded (The Sieve); tie-break: worst goal difference, then fewest goals scored
  // Use group_standings.goals_against as primary source so it's consistent with the GD tiebreaker
  // (falls back to team_stats.goals_conceded for teams not in standings)
  let topSieve: TeamStats | null = null;
  for (const t of allStats) {
    if (!topSieve) { topSieve = t; continue; }
    const tGA = standingsByTeam.get(t.team_name)?.goals_against ?? t.goals_conceded;
    const bGA = standingsByTeam.get(topSieve.team_name)?.goals_against ?? topSieve.goals_conceded;
    if (tGA > bGA) { topSieve = t; continue; }
    if (tGA === bGA) {
      const tGD  = standingsByTeam.get(t.team_name)?.goal_difference  ?? 0;
      const bGD  = standingsByTeam.get(topSieve.team_name)?.goal_difference ?? 0;
      if (tGD < bGD) { topSieve = t; continue; }
      if (tGD === bGD) {
        const tGF = standingsByTeam.get(t.team_name)?.goals_for  ?? 0;
        const bGF = standingsByTeam.get(topSieve.team_name)?.goals_for ?? 0;
        if (tGF < bGF) topSieve = t;
      }
    }
  }
  const topSieveGA = topSieve ? (standingsByTeam.get(topSieve.team_name)?.goals_against ?? topSieve.goals_conceded) : 0;

  const now = new Date();
  const tournamentOver = now >= TOURNAMENT_END;

  return [
    {
      slug: 'most_cards',
      name: 'The Josip Simunic Team Award',
      description: 'Filthiest team\n(yellow & red cards)',
      icon: '🟨',
      current_team: topCardsTotal > 0 ? topCards!.team_name : null,
      current_participant: topCardsTotal > 0 ? participant(topCards!.team_name) : null,
      value_label: topCardsTotal > 0
        ? `${topCards!.yellow_cards}Y · ${topCards!.red_cards}R`
        : null,
      is_manual: false,
      confirmed: tournamentOver && topCardsTotal > 0,
    },
    {
      slug: 'first_eliminated',
      name: 'Early Bath :(',
      description: 'The first team eliminated',
      icon: '✈️',
      current_team: firstOut?.team_name ?? null,
      current_participant: participant(firstOut?.team_name ?? null),
      value_label: firstOut?.eliminated_at
        ? `Eliminated · ${new Date(firstOut.eliminated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
        : null,
      is_manual: false,
      confirmed: !!firstOut,
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
      confirmed: tournamentOver && !!shotOverride?.team_name,
    },
    {
      slug: 'most_own_goals',
      name: 'OG',
      description: 'The team conceding the most spectacular own goal',
      icon: '🤦',
      current_team: ownGoalOverride?.team_name && ownGoalOverride.team_name !== '__hidden__' ? ownGoalOverride.team_name : null,
      current_participant: ownGoalOverride?.team_name && ownGoalOverride.team_name !== '__hidden__' ? participant(ownGoalOverride.team_name) : null,
      player_name: ownGoalOverride?.team_name !== '__hidden__' ? (ownGoalOverride?.value_label ?? null) : null,
      value_label: null,
      is_manual: true,
      mystery: true,
      hidden: ownGoalOverride?.team_name === '__hidden__',
      video_url: ownGoalOverride?.team_name !== '__hidden__' ? (ownGoalOverride?.notes ?? null) : null,
      confirmed: tournamentOver && !!(ownGoalOverride?.team_name && ownGoalOverride.team_name !== '__hidden__'),
    },
    {
      slug: 'top_scorer_team',
      name: 'The Golden Boot',
      description: "The tournament's top scorer",
      icon: '👟',
      current_team: topScorerTeam,
      current_participant: participant(topScorerTeam),
      tied_players: goldenBootTiedPlayers,
      player_name: goldenBootPlayerName,
      value_label: topScorer?.goals
        ? `${topScorer.goals} goal${topScorer.goals !== 1 ? 's' : ''}`
        : null,
      is_manual: false,
      confirmed: tournamentOver && !!topScorerTeam && !goldenBootTiedPlayers,
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
      confirmed: tournamentOver && !!(bicycleOverride?.team_name && bicycleOverride.team_name !== '__hidden__'),
    },
    {
      slug: 'sieve',
      name: 'Derby County',
      description: 'Most goals conceded overall',
      icon: '🪣',
      current_team: topSieveGA > 0 ? topSieve!.team_name : null,
      current_participant: topSieveGA > 0 ? participant(topSieve!.team_name) : null,
      value_label: topSieveGA > 0 ? `${topSieveGA} conceded` : null,
      is_manual: false,
      confirmed: tournamentOver && topSieveGA > 0,
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
