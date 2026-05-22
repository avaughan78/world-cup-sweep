import { NextRequest, NextResponse } from 'next/server';
import { normaliseTeamName } from '@/lib/football-api';

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

async function wikiData(title: string): Promise<{ image: string | null; extract: string | null }> {
  try {
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}` +
      `&prop=pageimages|extracts&format=json&exintro=true&exchars=900&pithumbsize=1400&origin=*`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return { image: null, extract: null };
    const data = await res.json();
    const page = Object.values((data.query?.pages ?? {}) as Record<string, unknown>)[0] as Record<string, unknown> | null;
    const image = (page?.thumbnail as { source?: string } | undefined)?.source ?? null;
    const raw = (page?.extract as string | undefined) ?? null;
    const extract = raw
      ?.replace(/<[^>]+>/g, '')
      .replace(/\s*\([^)]*\/[^)]*\/[^)]*\)/g, '')  // strip IPA pronunciations like (/ˈɪŋɡlənd/ ⓘ)
      .replace(/\[\d+\]/g, '')
      .replace(/\s+/g, ' ')
      .trim() ?? null;
    return { image, extract };
  } catch {
    return { image: null, extract: null };
  }
}

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get('team');
  if (!team) return NextResponse.json({ error: 'Missing team' }, { status: 400 });

  const restName = REST_MAP[team] ?? team;
  const wikiName = WIKI_MAP[team] ?? team;
  const wikiImageTitle = WIKI_IMAGE_TITLE[team] ?? null;

  // REST Countries — try exact match first, then partial
  type CountryRaw = Record<string, unknown>;
  let country: CountryRaw | null = null;
  for (const suffix of ['?fullText=true', '']) {
    if (country) break;
    try {
      const res = await fetch(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(restName)}${suffix}`,
        { next: { revalidate: 86400 } }
      );
      if (res.ok) {
        const arr = await res.json() as CountryRaw[];
        country = arr[0] ?? null;
      }
    } catch { /* ignore */ }
  }

  const capital =
    CAPITAL_OVERRIDE[team] ??
    (country?.capital as string[] | undefined)?.[0] ??
    null;

  // Fetch hero image — prefer city landmark, then fall back to country article
  const imageSource = wikiImageTitle ?? capital ?? wikiName;
  const imageData = await wikiData(imageSource);
  let wikiImage = imageData.image;

  // Fetch About extract from the country article
  const countryData = await wikiData(wikiName);
  const wikiExtract = countryData.extract;

  // If city image failed, try the country article image
  if (!wikiImage) wikiImage = countryData.image;

  // Squad from football-data.org
  let squad: Array<{ name: string; position: string; shirtNumber: number | null }> = [];
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (apiKey) {
    try {
      const season = process.env.FOOTBALL_SEASON ?? '2026';
      const headers = { 'X-Auth-Token': apiKey };

      const listRes = await fetch(
        `https://api.football-data.org/v4/competitions/WC/teams?season=${season}`,
        { headers, next: { revalidate: 3600 } }
      );
      if (listRes.ok) {
        type ApiTeamBasic = {
          id: number; name: string; shortName: string;
          squad?: Array<{ name: string; position: string; shirtNumber?: number }>;
        };
        const listData = await listRes.json() as { teams: ApiTeamBasic[] };
        const matched = listData.teams.find(t =>
          normaliseTeamName(t.name) === team ||
          normaliseTeamName(t.shortName) === team ||
          t.name.toLowerCase().includes(team.toLowerCase()) ||
          team.toLowerCase().includes(t.name.toLowerCase())
        );
        if (matched) {
          const teamRes = await fetch(
            `https://api.football-data.org/v4/teams/${matched.id}`,
            { headers, next: { revalidate: 3600 } }
          );
          if (teamRes.ok) {
            const teamData = await teamRes.json() as {
              squad?: Array<{ name: string; position: string; shirtNumber?: number }>;
            };
            squad = (teamData.squad ?? []).map(p => ({
              name: p.name,
              position: p.position,
              shirtNumber: p.shirtNumber ?? null,
            }));
          }
          if (!squad.length && matched.squad?.length) {
            squad = matched.squad.map(p => ({
              name: p.name,
              position: p.position,
              shirtNumber: p.shirtNumber ?? null,
            }));
          }
        }
      }
    } catch { /* ignore */ }
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
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}
