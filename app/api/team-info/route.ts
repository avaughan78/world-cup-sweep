import { NextRequest, NextResponse } from 'next/server';
import { normaliseTeamName } from '@/lib/football-api';

// Map sweepstake names → REST Countries search name
const REST_MAP: Record<string, string> = {
  'Ivory Coast': "Côte d'Ivoire",
  'DR Congo': 'Democratic Republic of the Congo',
  'Türkiye': 'Turkey',
  'Curaçao': 'Curaçao',
  'Bosnia and Herzegovina': 'Bosnia and Herzegovina',
  'South Korea': 'South Korea',
  'United States': 'United States',
  'New Zealand': 'New Zealand',
  'Saudi Arabia': 'Saudi Arabia',
  'Cape Verde': 'Cabo Verde',
};

// Map sweepstake names → Wikipedia article title
const WIKI_MAP: Record<string, string> = {
  'Ivory Coast': 'Ivory Coast',
  'DR Congo': 'Democratic Republic of the Congo',
  'Türkiye': 'Turkey',
  'South Korea': 'South Korea',
  'Bosnia and Herzegovina': 'Bosnia and Herzegovina',
};

async function wikiData(title: string): Promise<{ image: string | null; extract: string | null }> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages|extracts&format=json&exintro=true&exchars=900&pithumbsize=1400&origin=*`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return { image: null, extract: null };
    const data = await res.json();
    const page = Object.values((data.query?.pages ?? {}) as Record<string, unknown>)[0] as Record<string, unknown> | null;
    const image = (page?.thumbnail as { source?: string } | undefined)?.source ?? null;
    const raw = (page?.extract as string | undefined) ?? null;
    const extract = raw
      ?.replace(/<[^>]+>/g, '')
      .replace(/\s*\(\/[^)]+\/[^)]*\)/g, '')  // strip IPA
      .replace(/\[\d+\]/g, '')                 // strip footnote refs
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

  const capital = (country?.capital as string[] | undefined)?.[0] ?? null;

  // Wikipedia: prefer capital city image + country extract
  let wikiImage: string | null = null;
  let wikiExtract: string | null = null;

  if (capital) {
    const c = await wikiData(capital);
    wikiImage = c.image;
    // Get country extract (more informative than the city article)
    const w = await wikiData(wikiName);
    wikiExtract = w.extract;
    if (!wikiImage) wikiImage = w.image;
  } else {
    const w = await wikiData(wikiName);
    wikiImage = w.image;
    wikiExtract = w.extract;
  }

  // Squad from football-data.org
  let squad: Array<{ name: string; position: string; shirtNumber: number | null }> = [];
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (apiKey) {
    try {
      const season = process.env.FOOTBALL_SEASON ?? '2026';
      const res = await fetch(
        `https://api.football-data.org/v4/competitions/WC/teams?season=${season}`,
        { headers: { 'X-Auth-Token': apiKey }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json() as { teams: Array<{ name: string; shortName: string; squad?: Array<{ name: string; position: string; shirtNumber?: number }> }> };
        const match = data.teams.find(t =>
          normaliseTeamName(t.name) === team || normaliseTeamName(t.shortName) === team
        );
        squad = (match?.squad ?? []).map(p => ({
          name: p.name,
          position: p.position,
          shirtNumber: p.shirtNumber ?? null,
        }));
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
