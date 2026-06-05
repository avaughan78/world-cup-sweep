import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSquadCache, setSquadCache } from '@/lib/db';
import { normaliseTeamName } from '@/lib/football-api';
import { GROUPS_2026 } from '@/lib/groups';
import { fetchPlayerPhoto } from '@/lib/player-photos';

const ALL_TEAMS = Object.values(GROUPS_2026).flat();

function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchTeamBadge(idTeam: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${encodeURIComponent(idTeam)}`,
      {},
      5000
    );
    if (!res.ok) return null;
    const data = await res.json() as { teams?: Array<{ strBadge?: string }> };
    return data.teams?.[0]?.strBadge || null;
  } catch {
    return null;
  }
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// GET — returns status: which teams are cached with photos, which still need fetching
export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const status = await Promise.all(ALL_TEAMS.map(async team => {
    const cached = await getSquadCache(team);
    const photos = cached?.filter(p => p.photo_url).length ?? 0;
    const players = cached?.length ?? 0;
    return { team, players, photos, cached: players > 0 };
  }));

  const done  = status.filter(s => s.photos > 0).length;
  const total = ALL_TEAMS.length;

  return NextResponse.json({ done, total, remaining: total - done, teams: status });
}

// POST — processes ONE next uncached team (or a specific team via body)
export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY not set' }, { status: 500 });

  const body = await req.json().catch(() => ({})) as { team?: string; force?: boolean };

  // Pick the team to process: explicit request or next uncached team
  let team: string | null = body.team ?? null;
  if (!team || body.force) {
    // Find first team with no photos
    for (const t of ALL_TEAMS) {
      const cached = await getSquadCache(t);
      const hasPhotos = cached?.some(p => p.photo_url) ?? false;
      if (!hasPhotos) { team = t; break; }
    }
  }

  if (!team) {
    const remaining = 0;
    return NextResponse.json({ ok: true, done: true, message: 'All teams already have photos', remaining });
  }

  // Fetch WC teams list from football-data.org
  const headers = { 'X-Auth-Token': apiKey };
  let listRes = await fetchWithTimeout(`https://api.football-data.org/v4/competitions/WC/teams`, { headers });
  if (!listRes.ok) {
    listRes = await fetchWithTimeout(
      `https://api.football-data.org/v4/competitions/WC/teams?season=${process.env.FOOTBALL_SEASON ?? '2026'}`,
      { headers }
    );
  }
  if (!listRes.ok) {
    return NextResponse.json({ error: `football-data.org failed: ${listRes.status}` }, { status: 502 });
  }

  type ApiTeamBasic = { id: number; name: string; shortName: string; squad?: Array<{ name: string; position: string; shirtNumber?: number }> };
  const { teams: allApiTeams } = await listRes.json() as { teams: ApiTeamBasic[] };

  const matched = allApiTeams.find(t =>
    normaliseTeamName(t.name) === team ||
    normaliseTeamName(t.shortName) === team ||
    t.name.toLowerCase().includes(team!.toLowerCase()) ||
    team!.toLowerCase().includes(t.name.toLowerCase())
  );

  if (!matched) {
    return NextResponse.json({ ok: false, team, error: 'No API match for team' });
  }

  // Fetch squad from football-data.org
  const teamRes = await fetchWithTimeout(`https://api.football-data.org/v4/teams/${matched.id}`, { headers });
  let squad: Array<{ name: string; position: string; shirtNumber: number | null }> = [];

  if (teamRes.ok) {
    const teamData = await teamRes.json() as { squad?: Array<{ name: string; position: string; shirtNumber?: number }> };
    squad = (teamData.squad ?? []).map(p => ({ name: p.name, position: p.position, shirtNumber: p.shirtNumber ?? null }));
  }
  if (!squad.length && matched.squad?.length) {
    squad = matched.squad.map(p => ({ name: p.name, position: p.position, shirtNumber: p.shirtNumber ?? null }));
  }
  if (!squad.length) {
    return NextResponse.json({ ok: false, team, error: 'Empty squad from API' });
  }

  // Fetch player photos sequentially — 1500ms between each to stay under TheSportsDB
  // free-tier rate limits. Falls back to Wikipedia if TheSportsDB returns nothing.
  const infos: Array<{ photo: string | null; club: string | null; idTeam: string | null }> = [];
  for (const player of squad) {
    const info = await fetchPlayerPhoto(player.name);
    infos.push(info);
    await delay(1500);
  }

  // Resolve club badges
  const uniqueIds = [...new Set(infos.map(i => i.idTeam).filter((id): id is string => !!id))];
  const badgePairs = await Promise.all(uniqueIds.map(async id => [id, await fetchTeamBadge(id)] as const));
  const badgeMap = new Map(badgePairs);

  const enriched = squad.map((p, i) => ({
    player_name: p.name,
    position: p.position,
    shirt_number: p.shirtNumber,
    photo_url: infos[i].photo,
    club: infos[i].club,
    club_badge_url: infos[i].idTeam ? (badgeMap.get(infos[i].idTeam!) ?? null) : null,
  }));

  await setSquadCache(team, enriched);

  const photoCount = enriched.filter(p => p.photo_url).length;

  // Count remaining teams
  let remaining = 0;
  for (const t of ALL_TEAMS) {
    const cached = await getSquadCache(t);
    if (!cached?.some(p => p.photo_url)) remaining++;
  }

  return NextResponse.json({
    ok: true,
    team,
    players: enriched.length,
    photos: photoCount,
    remaining,
  });
}
