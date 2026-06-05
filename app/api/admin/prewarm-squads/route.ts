import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSquadCache, setSquadCache } from '@/lib/db';
import { normaliseTeamName } from '@/lib/football-api';
import { GROUPS_2026 } from '@/lib/groups';

const ALL_TEAMS = Object.values(GROUPS_2026).flat();

function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function fetchPlayerInfo(name: string): Promise<{ photo: string | null; club: string | null; idTeam: string | null }> {
  try {
    const res = await fetchWithTimeout(
      `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
      {},
      4000
    );
    if (!res.ok) return { photo: null, club: null, idTeam: null };
    const data = await res.json() as { player?: Array<{ strThumb?: string; strCutout?: string; strTeam?: string; idTeam?: string }> };
    const p = data?.player?.[0];
    return {
      photo: p?.strThumb || p?.strCutout || null,
      club: p?.strTeam || null,
      idTeam: p?.idTeam || null,
    };
  } catch {
    return { photo: null, club: null, idTeam: null };
  }
}

async function fetchTeamBadge(idTeam: string): Promise<string | null> {
  try {
    const res = await fetchWithTimeout(
      `https://www.thesportsdb.com/api/v1/json/3/lookupteam.php?id=${encodeURIComponent(idTeam)}`,
      {},
      4000
    );
    if (!res.ok) return null;
    const data = await res.json() as { teams?: Array<{ strBadge?: string }> };
    return data.teams?.[0]?.strBadge || null;
  } catch {
    return null;
  }
}

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY not set' }, { status: 500 });

  const { force = false } = await req.json().catch(() => ({})) as { force?: boolean };

  // Determine which teams need fetching
  const teamsToFetch = force
    ? ALL_TEAMS
    : await Promise.all(ALL_TEAMS.map(async team => {
        const cached = await getSquadCache(team);
        const hasPhotos = cached?.some(p => p.photo_url) ?? false;
        return hasPhotos ? null : team;
      })).then(results => results.filter((t): t is string => t !== null));

  if (!teamsToFetch.length) {
    return NextResponse.json({ ok: true, message: 'All squads already cached with photos', fetched: 0 });
  }

  // Fetch the WC teams list once
  const headers = { 'X-Auth-Token': apiKey };
  let listRes = await fetchWithTimeout(`https://api.football-data.org/v4/competitions/WC/teams`, { headers });
  if (!listRes.ok) {
    listRes = await fetchWithTimeout(
      `https://api.football-data.org/v4/competitions/WC/teams?season=${process.env.FOOTBALL_SEASON ?? '2026'}`,
      { headers }
    );
  }
  if (!listRes.ok) {
    return NextResponse.json({ error: `football-data.org teams list failed: ${listRes.status}` }, { status: 502 });
  }
  type ApiTeamBasic = { id: number; name: string; shortName: string; squad?: Array<{ name: string; position: string; shirtNumber?: number }> };
  const { teams: allApiTeams } = await listRes.json() as { teams: ApiTeamBasic[] };

  const results: Record<string, { players: number; photos: number; error?: string }> = {};

  for (const team of teamsToFetch) {
    try {
      const matched = allApiTeams.find(t =>
        normaliseTeamName(t.name) === team ||
        normaliseTeamName(t.shortName) === team ||
        t.name.toLowerCase().includes(team.toLowerCase()) ||
        team.toLowerCase().includes(t.name.toLowerCase())
      );

      if (!matched) {
        results[team] = { players: 0, photos: 0, error: 'no API match' };
        continue;
      }

      // Fetch squad
      const teamRes = await fetchWithTimeout(`https://api.football-data.org/v4/teams/${matched.id}`, { headers });
      await delay(200); // respect football-data.org rate limit (10 req/min)

      let squad: Array<{ name: string; position: string; shirtNumber: number | null }> = [];
      if (teamRes.ok) {
        const teamData = await teamRes.json() as { squad?: Array<{ name: string; position: string; shirtNumber?: number }> };
        squad = (teamData.squad ?? []).map(p => ({ name: p.name, position: p.position, shirtNumber: p.shirtNumber ?? null }));
      }
      if (!squad.length && matched.squad?.length) {
        squad = matched.squad.map(p => ({ name: p.name, position: p.position, shirtNumber: p.shirtNumber ?? null }));
      }
      if (!squad.length) {
        results[team] = { players: 0, photos: 0, error: 'empty squad' };
        continue;
      }

      // Fetch player photos — batches of 5 with 300ms gaps to stay under TheSportsDB rate limit
      const BATCH = 5;
      const infos: Array<{ photo: string | null; club: string | null; idTeam: string | null }> = [];
      for (let i = 0; i < squad.length; i += BATCH) {
        const batch = squad.slice(i, i + BATCH);
        const batchInfos = await Promise.all(batch.map(p => fetchPlayerInfo(p.name)));
        infos.push(...batchInfos);
        if (i + BATCH < squad.length) await delay(300);
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
      results[team] = { players: enriched.length, photos: photoCount };

      // Pause between teams to avoid hammering APIs
      await delay(500);
    } catch (err) {
      results[team] = { players: 0, photos: 0, error: String(err) };
    }
  }

  const totalPlayers = Object.values(results).reduce((s, r) => s + r.players, 0);
  const totalPhotos  = Object.values(results).reduce((s, r) => s + r.photos,  0);

  return NextResponse.json({
    ok: true,
    message: `Pre-warmed ${teamsToFetch.length} teams: ${totalPlayers} players, ${totalPhotos} photos`,
    fetched: teamsToFetch.length,
    results,
  });
}
