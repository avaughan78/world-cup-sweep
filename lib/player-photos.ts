function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 5000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...opts, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export type PlayerPhotoResult = {
  photo: string | null;
  club: string | null;
  idTeam: string | null;
};

// Per-player overrides. All fields optional:
//   club:      force a specific club name (skips TheSportsDB club detection)
//   wikiTitle: use this Wikipedia article title instead of the player's name
//              (handles accented names, disambiguation, name mismatches)
const PLAYER_OVERRIDE: Record<string, { club?: string; wikiTitle?: string }> = {
  'Reece James': { club: 'Chelsea' },
  'Che Adams':   { wikiTitle: 'Ché Adams' },
};

export async function fetchPlayerPhoto(name: string): Promise<PlayerPhotoResult> {
  const override = PLAYER_OVERRIDE[name];

  // ── TheSportsDB first (clean cutout headshots) ────────────────────────────
  if (!override) {
    try {
      const res = await fetchWithTimeout(
        `https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(name)}`,
        {},
        4000
      );
      if (res.ok) {
        const data = await res.json() as {
          player?: Array<{ strThumb?: string; strCutout?: string; strTeam?: string; idTeam?: string }>;
        };
        const p = data?.player?.[0];
        if (p?.strThumb || p?.strCutout) {
          return {
            photo: p.strThumb || p.strCutout || null,
            club: p.strTeam || null,
            idTeam: p.idTeam || null,
          };
        }
      }
    } catch { /* fall through to Wikipedia */ }
  }

  // ── Wikipedia fallback ────────────────────────────────────────────────────
  try {
    const wikiName = override?.wikiTitle ?? name;
    const t1 = encodeURIComponent(wikiName);
    const t2 = encodeURIComponent(`${wikiName} (footballer)`);
    const url =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${t1}|${t2}` +
      `&prop=pageimages&format=json&pithumbsize=300&origin=*`;
    const res = await fetchWithTimeout(url, {}, 5000);
    if (res.ok) {
      const data = await res.json() as {
        query?: { pages?: Record<string, { title?: string; thumbnail?: { source: string }; missing?: string }> };
      };
      const pages = Object.values(data.query?.pages ?? {}).filter(p => !('missing' in p) && p.thumbnail?.source);
      // Prefer the (footballer) disambiguation over a plain-name article (e.g. George Hirst the cricketer)
      const image = (pages.find(p => p.title?.includes('(footballer)')) ?? pages[0])?.thumbnail?.source ?? null;
      if (image) return { photo: image, club: override?.club ?? null, idTeam: null };
    }
  } catch { /* ignore */ }

  return { photo: null, club: override?.club ?? null, idTeam: null };
}
