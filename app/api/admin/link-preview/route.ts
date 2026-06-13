import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

// Extract a meta tag content by property or name, handling both attribute orderings
function meta(html: string, ...keys: string[]): string | null {
  for (const key of keys) {
    // Escape regex special chars in key (e.g. the dot in og:image:url)
    const ek = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${ek}["'][^>]+content=["']([^"'<>]+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"'<>]+)["'][^>]+(?:property|name)=["']${ek}["']`, 'i'),
      // Some sites use unquoted or double-quoted with whitespace variants
      new RegExp(`<meta\\s+property=["']${ek}["']\\s+content=["']([^"'<>]+)["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]?.trim()) return decodeEntities(m[1].trim());
    }
  }
  return null;
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
    /\/live\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return m[1];
  }
  return null;
}

// Extract Wikipedia page title from a URL like https://en.wikipedia.org/wiki/Page_Title
function extractWikipediaSlug(url: string): { lang: string; slug: string } | null {
  const m = url.match(/^https?:\/\/([a-z]+)\.wikipedia\.org\/wiki\/(.+)/);
  if (!m) return null;
  return { lang: m[1], slug: m[2].split('#')[0] };
}

async function readHead(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  let html = '';
  if (reader) {
    const decoder = new TextDecoder();
    while (html.length < 300_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      if (/<\/head>/i.test(html)) break;
    }
    reader.cancel();
  }
  return html;
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { url } = await req.json() as { url?: string };
  if (!url?.trim()) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  // ── YouTube ──────────────────────────────────────────────────────────────────
  if (parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be')) {
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (oembedRes.ok) {
        const d = await oembedRes.json() as { title?: string; thumbnail_url?: string };
        const videoId = extractYouTubeId(url);
        const image_url = videoId
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : (d.thumbnail_url ?? null);
        return NextResponse.json({ title: d.title ?? null, description: null, image_url, source: 'YouTube', type: 'video' });
      }
    } catch { /* fall through */ }
  }

  // ── Wikipedia ─────────────────────────────────────────────────────────────────
  const wikiSlug = extractWikipediaSlug(url);
  if (wikiSlug) {
    try {
      const apiRes = await fetch(
        `https://${wikiSlug.lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiSlug.slug)}`,
        {
          headers: { 'User-Agent': 'WCSweep/1.0 (highlight link preview)' },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (apiRes.ok) {
        const d = await apiRes.json() as {
          title?: string;
          description?: string;
          extract?: string;
          thumbnail?: { source?: string };
        };
        return NextResponse.json({
          title: d.title ?? null,
          description: d.description ?? (d.extract ? d.extract.slice(0, 200) : null),
          image_url: d.thumbnail?.source ?? null,
          source: 'Wikipedia',
          type: 'article',
        });
      }
    } catch { /* fall through to HTML */ }
  }

  // ── General page ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: AbortSignal.timeout(12000),
      redirect: 'follow',
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 });
    }

    const html = await readHead(res);

    const title =
      meta(html, 'og:title', 'twitter:title') ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null;

    const description =
      meta(html, 'og:description', 'twitter:description', 'description');

    const image_url =
      meta(html, 'og:image', 'og:image:url', 'twitter:image', 'twitter:image:src');

    const source =
      meta(html, 'og:site_name') ??
      parsedUrl.hostname.replace(/^www\./, '');

    return NextResponse.json({
      title: title ? decodeEntities(title) : null,
      description: description ? decodeEntities(description) : null,
      image_url,
      source,
      type: 'article',
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
