import { parse } from 'node-html-parser';
import { normaliseTeamName } from './football-api';

const FBREF_BASE = 'https://fbref.com';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-GB,en;q=0.9',
};

async function fbrefFetch(path: string): Promise<string> {
  const res = await fetch(`${FBREF_BASE}${path}`, {
    headers: HEADERS,
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`FBRef ${res.status} for ${path}`);
  return res.text();
}

// FBRef sometimes wraps tables in HTML comments to slow scrapers — strip them
function uncomment(html: string): string {
  return html.replace(/<!--([\s\S]*?)-->/g, '$1');
}

export interface SquadMiscStats {
  cards: Map<string, { yellow: number; red: number }>;
  ownGoals: Map<string, number>;
}

export async function scrapeSquadMiscStats(year: string): Promise<SquadMiscStats> {
  const raw = await fbrefFetch(`/en/comps/1/${year}/misc/${year}-FIFA-World-Cup-Stats`);
  const html = uncomment(raw);
  const root = parse(html);

  const cards = new Map<string, { yellow: number; red: number }>();
  const ownGoals = new Map<string, number>();

  // Squad-level misc stats (cards, own goals)
  const table =
    root.querySelector('#stats_squads_misc_for') ??
    root.querySelector('table[id*="squads_misc_for"]');

  if (!table) throw new Error('FBRef: squad misc stats table not found');

  for (const row of table.querySelectorAll('tbody tr')) {
    // Skip header spacer rows
    if (row.classList.contains('thead') || row.classList.contains('spacer')) continue;

    const teamCell = row.querySelector('[data-stat="team"]');
    const yellowCell = row.querySelector('[data-stat="cards_yellow"]');
    const redCell = row.querySelector('[data-stat="cards_red"]');
    const ogCell = row.querySelector('[data-stat="own_goals"]');

    const teamRaw = teamCell?.text.trim();
    if (!teamRaw || teamRaw === 'Squad') continue;

    const team = normaliseTeamName(teamRaw);
    const yellow = parseInt(yellowCell?.text.trim() ?? '0') || 0;
    const red = parseInt(redCell?.text.trim() ?? '0') || 0;
    const ogs = parseInt(ogCell?.text.trim() ?? '0') || 0;

    if (yellow || red) cards.set(team, { yellow, red });
    if (ogs) ownGoals.set(team, ogs);
  }

  return { cards, ownGoals };
}

export interface TopScorerResult {
  playerName: string;
  teamName: string;
  goals: number;
  nationality: string;
}

export async function scrapeTopScorer(year: string): Promise<TopScorerResult | null> {
  // Small delay to be polite between requests
  await new Promise(r => setTimeout(r, 1200));

  const raw = await fbrefFetch(`/en/comps/1/${year}/stats/${year}-FIFA-World-Cup-Stats`);
  const html = uncomment(raw);
  const root = parse(html);

  const table =
    root.querySelector('#stats_standard') ??
    root.querySelector('table[id*="stats_standard"]');

  if (!table) throw new Error('FBRef: player stats table not found');

  let top: TopScorerResult | null = null;

  for (const row of table.querySelectorAll('tbody tr')) {
    if (row.classList.contains('thead') || row.classList.contains('spacer')) continue;

    const playerCell = row.querySelector('[data-stat="player"]');
    const teamCell = row.querySelector('[data-stat="team"]');
    const natCell = row.querySelector('[data-stat="nationality"]');
    const goalsCell = row.querySelector('[data-stat="goals"]');

    const player = playerCell?.text.trim();
    const teamRaw = teamCell?.text.trim();
    const goals = parseInt(goalsCell?.text.trim() ?? '0') || 0;

    if (!player || !teamRaw || goals === 0) continue;
    if (!top || goals > top.goals) {
      top = {
        playerName: player,
        teamName: normaliseTeamName(teamRaw),
        goals,
        nationality: natCell?.text.trim() ?? '',
      };
    }
  }

  return top;
}
