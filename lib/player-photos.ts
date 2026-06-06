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

// TheSportsDB sometimes matches a lower-league namesake instead of the international.
// Entries here skip TheSportsDB entirely and go straight to Wikipedia for the photo.
// Club is set to the correct value.
const PLAYER_OVERRIDE: Record<string, { club: string }> = {
  'Reece James': { club: 'Chelsea' },
};

export async function fetchPlayerPhoto(name: string): Promise<PlayerPhotoResult> {
  const override = PLAYER_OVERRIDE[name];

  // ── TheSportsDB first (clean cutout headshots) ────────────────────────────
  if (!override) {
    try {
      const res = await fetchWithTimeout(
        `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
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
    const t1 = encodeURIComponent(name);
    const t2 = encodeURIComponent(`${name} (footballer)`);
    const url =
      `https://en.wikipedia.org/w/api.php?action=query` +
      `&titles=${t1}|${t2}` +
      `&prop=pageimages&format=json&pithumbsize=300&origin=*`;
    const res = await fetchWithTimeout(url, {}, 5000);
    if (res.ok) {
      const data = await res.json() as {
        query?: { pages?: Record<string, { thumbnail?: { source: string }; missing?: string }> };
      };
      const pages = Object.values(data.query?.pages ?? {});
      const image = pages
        .filter(p => !('missing' in p) && p.thumbnail?.source)
        .map(p => p.thumbnail!.source)[0] ?? null;
      if (image) return { photo: image, club: override?.club ?? null, idTeam: null };
    }
  } catch { /* ignore */ }

  return { photo: null, club: override?.club ?? null, idTeam: null };
}
