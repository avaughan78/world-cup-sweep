import { NextRequest, NextResponse } from 'next/server';
import { normaliseTeamName } from '@/lib/football-api';
import { getSquadCache, setSquadCache } from '@/lib/db';

// Map sweepstake names → REST Countries search name
// England & Scotland are not sovereign states — map to United Kingdom for stats
const REST_MAP: Record<string, string> = {
  'England':                 'United Kingdom',
  'Scotland':                'United Kingdom',
  'Ivory Coast':             "Côte d'Ivoire",
  'DR Congo':                'Democratic Republic of the Congo',
  'Türkiye':                 'Turkey',
  'Curaçao':                 'Curaçao',
  'Bosnia and Herzegovina':  'Bosnia and Herzegovina',
  'South Korea':             'South Korea',
  'United States':           'United States',
  'New Zealand':             'New Zealand',
  'Saudi Arabia':            'Saudi Arabia',
  'Cape Verde':              'Cabo Verde',
};

// Override capital city when REST Countries would return wrong or no capital
const CAPITAL_OVERRIDE: Record<string, string> = {
  'England':  'London',
  'Scotland': 'Edinburgh',
};

// Wikipedia article to use for the hero image (city landmark preferred)
const WIKI_IMAGE_TITLE: Record<string, string> = {
  'England':       'London',
  'Scotland':      'Edinburgh',
  'Haiti':         'Port-au-Prince',
  'Curaçao':       'Willemstad',
  'Jordan':        'Amman',
  'Algeria':       'Algiers',
  'Austria':       'Vienna',
  'Panama':        'Panama City',
  'Ghana':         'Accra',
  'Uzbekistan':    'Tashent',
  'Iraq':          'Baghdad',
  'New Zealand':   'Auckland',
  'Cape Verde':    'Praia',
  'Czechia':       'Prague',
};

// Wikipedia article to use for the About text
const WIKI_MAP: Record<string, string> = {
  'Ivory Coast':             'Ivory Coast',
  'DR Congo':                'Democratic Republic of the Congo',
  'Türkiye':                 'Turkey',
  'South Korea':             'South Korea',
  'Bosnia and Herzegovina':  'Bosnia and Herzegovina',
  'Curaçao':                 'Curaçao',
};

function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

async function wikiData(title: string): Promise<{ image: string | null; extract: string | null }> {
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}` +
      `&prop=pageimages|extracts&format=json&exintro=true&pithumbsize=1400&origin=*`;
    const res = await fetchWithTimeout(url, { cache: 'no-store' });
    if (!res.ok) return { image: null, extract: null };
    const data = await res.json();
    const page = Object.values((data.query?.pages ?? {}) as Record<string, unknown>)[0] as Record<string, unknown> | null;
    const image = (page?.thumbnail as { source?: string } | undefined)?.source ?? null;
    const raw = (page?.extract as string | undefined) ?? null;
    const extract = raw
      ?.replace(/<[^>]+>/g, '')
      .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/\s*\([^)]*\/[^)]*\/[^)]*\)/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim() ?? null;
    return { image, extract };
  } catch {
    return { image: null, extract: null };
  }
}

type SquadRow = { name: string; position: string; shirtNumber: number | null; photo: string | null; club: string | null; clubBadge: string | null };

// Prevents stampede: concurrent requests for the same uncached team share one API fetch
const inflight = new Map<string, Promise<SquadRow[]>>();

export async function GET(req: NextRequest) {
  const teamParam = req.nextUrl.searchParams.get('team');
  if (!teamParam) return NextResponse.json({ error: 'Missing team' }, { status: 400 });
  const team: string = teamParam;

  const restName = REST_MAP[team] ?? team;
  const wikiName = WIKI_MAP[team] ?? team;
  const wikiImageTitle = WIKI_IMAGE_TITLE[team] ?? null;

  // Fetch REST Countries + Wikipedia extract in parallel
  type CountryRaw = Record<string, unknown>;

  async function fetchCountry(): Promise<CountryRaw | null> {
    for (const suffix of ['?fullText=true', '']) {
      try {
        const res = await fetchWithTimeout(
          `https://restcountries.com/v3.1/name/${encodeURIComponent(restName)}${suffix}`,
          { cache: 'no-store' }
        );
        if (res.ok) {
          const arr = await res.json() as CountryRaw[];
          if (arr[0]) return arr[0];
        }
      } catch { /* ignore */ }
    }
    return null;
  }

  type PlayerInfo = { photo: string | null; club: string | null; idTeam: string | null };

  async function fetchPlayerInfo(name: string): Promise<PlayerInfo> {
    try {
      const res = await fetchWithTimeout(
        `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
        {},
        3000
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
        3000
      );
      if (!res.ok) return null;
      const data = await res.json() as { teams?: Array<{ strBadge?: string }> };
      return data.teams?.[0]?.strBadge || null;
    } catch {
      return null;
    }
  }

  async function enrichWithBadges(
    sq: Array<{ name: string; position: string; shirtNumber: number | null }>,
    infos: PlayerInfo[]
  ): Promise<Array<{ name: string; position: string; shirtNumber: number | null; photo: string | null; club: string | null; clubBadge: string | null }>> {
    const uniqueIds = [...new Set(infos.map(i => i.idTeam).filter((id): id is string => !!id))];
    const badgePairs = await Promise.all(uniqueIds.map(async id => [id, await fetchTeamBadge(id)] as const));
    const badgeMap = new Map(badgePairs);
    return sq.map((p, i) => ({
      ...p,
      photo: infos[i].photo,
      club: infos[i].club,
      clubBadge: infos[i].idTeam ? (badgeMap.get(infos[i].idTeam!) ?? null) : null,
    }));
  }

  async function fetchSquad(): Promise<SquadRow[]> {
    // ── DB cache hit ──────────────────────────────────────────────────────────
    const cached = await getSquadCache(team);
    if (cached) {
      console.log(`[team-info] squad cache hit for "${team}" (${cached.length} players)`);
      return cached.map(p => ({
        name: p.player_name, position: p.position, shirtNumber: p.shirt_number,
        photo: p.photo_url, club: p.club, clubBadge: p.club_badge_url,
      }));
    }

    // ── Stampede guard: join any in-flight fetch for the same team ─────────────
    const existing = inflight.get(team);
    if (existing) return existing;

    // ── Cache miss: start fetch, register promise so concurrent requests join it ──
    const fetchPromise = (async (): Promise<SquadRow[]> => {
      const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) { console.warn('[team-info] No FOOTBALL_DATA_API_KEY'); return []; }
    try {
      const season = process.env.FOOTBALL_SEASON ?? '2026';
      const headers = { 'X-Auth-Token': apiKey };
      // Try without season param first — the WC teams endpoint returns 400 for seasons
      // not yet registered (pre-tournament). Fall back to season param if needed.
      let listRes = await fetchWithTimeout(
        `https://api.football-data.org/v4/competitions/WC/teams`,
        { headers, cache: 'no-store' }
      );
      if (!listRes.ok) {
        listRes = await fetchWithTimeout(
          `https://api.football-data.org/v4/competitions/WC/teams?season=${season}`,
          { headers, cache: 'no-store' }
        );
      }
      if (!listRes.ok) {
        const body = await listRes.text().catch(() => '');
        console.error(`[team-info] WC teams list failed: ${listRes.status} — ${body.slice(0, 200)}`);
        return [];
      }
      type ApiTeamBasic = {
        id: number; name: string; shortName: string;
        squad?: Array<{ name: string; position: string; shirtNumber?: number }>;
      };
      const listData = await listRes.json() as { teams: ApiTeamBasic[] };
      const apiNames = listData.teams.map(t => t.name);
      const matched = listData.teams.find(t =>
        normaliseTeamName(t.name) === team ||
        normaliseTeamName(t.shortName) === team ||
        t.name.toLowerCase().includes(team.toLowerCase()) ||
        team.toLowerCase().includes(t.name.toLowerCase())
      );
      if (!matched) {
        console.warn(`[team-info] No match for "${team}" in API teams: ${apiNames.join(', ')}`);
        return [];
      }
      console.log(`[team-info] "${team}" matched to API team "${matched.name}" (id ${matched.id})`);
      const teamRes = await fetchWithTimeout(
        `https://api.football-data.org/v4/teams/${matched.id}`,
        { headers, cache: 'no-store' }
      );

      let result: SquadRow[] = [];
      if (teamRes.ok) {
        const teamData = await teamRes.json() as {
          squad?: Array<{ name: string; position: string; shirtNumber?: number }>;
        };
        const sq = (teamData.squad ?? []).map(p => ({
          name: p.name, position: p.position, shirtNumber: p.shirtNumber ?? null,
        }));
        console.log(`[team-info] /teams/${matched.id} squad: ${sq.length} players`);
        if (sq.length) {
          const infos = await Promise.all(sq.map(p => fetchPlayerInfo(p.name)));
          result = await enrichWithBadges(sq, infos);
        }
      } else {
        console.error(`[team-info] /teams/${matched.id} failed: ${teamRes.status}`);
      }

      if (!result.length && matched.squad?.length) {
        console.log(`[team-info] Falling back to inline squad: ${matched.squad.length} players`);
        const sq = matched.squad.map(p => ({
          name: p.name, position: p.position, shirtNumber: p.shirtNumber ?? null,
        }));
        const infos = await Promise.all(sq.map(p => fetchPlayerInfo(p.name)));
        result = await enrichWithBadges(sq, infos);
      }

      if (!result.length) {
        console.warn(`[team-info] Squad empty for "${team}" — API may not have WC 2026 squads yet`);
        return [];
      }

      // ── Persist to cache (only if TheSportsDB returned at least some data) ──
      const hasAnyPhoto = result.some(p => p.photo !== null);
      if (hasAnyPhoto) {
        await setSquadCache(team, result.map(p => ({
          player_name: p.name, position: p.position, shirt_number: p.shirtNumber,
          photo_url: p.photo, club: p.club, club_badge_url: p.clubBadge,
        })));
        console.log(`[team-info] squad cached for "${team}" (${result.length} players)`);
      } else {
        console.warn(`[team-info] skipping cache for "${team}" — TheSportsDB returned no photos`);
      }

      return result;
    } catch (err) {
      console.error('[team-info] fetchSquad error:', err);
    }
    return [];
    })().finally(() => inflight.delete(team));

    inflight.set(team, fetchPromise);
    return fetchPromise;
  }

  // Run country data + Wikipedia extract + squad fetch in parallel
  const [country, countryWiki, squad] = await Promise.all([
    fetchCountry(),
    wikiData(wikiName),
    fetchSquad(),
  ]);

  const capital =
    CAPITAL_OVERRIDE[team] ??
    (country?.capital as string[] | undefined)?.[0] ??
    null;

  // Hero image: prefer city landmark article, fall back to country article
  const imageSource = wikiImageTitle ?? capital ?? wikiName;
  let wikiImage: string | null = null;
  let wikiExtract: string | null = countryWiki.extract;

  if (imageSource === wikiName) {
    wikiImage = countryWiki.image;
  } else {
    const imageData = await wikiData(imageSource);
    wikiImage = imageData.image ?? countryWiki.image;
  }

  const currencies = country?.currencies
    ? Object.values(country.currencies as Record<string, { name: string }>).map(c => c.name)
    : [];
  const languages = country?.languages
    ? Object.values(country.languages as Record<string, string>)
    : [];

  return NextResponse.json({
    team,
    capital,
    population: (country?.population as number | undefined) ?? null,
    area: (country?.area as number | undefined) ?? null,
    currencies,
    languages,
    wikiImage,
    wikiExtract,
    squad,
  }, {
    headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
