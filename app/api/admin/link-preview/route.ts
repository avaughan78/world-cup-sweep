import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';

// Extract a meta tag content by property or name, handling both attribute orderings
function meta(html: string, ...keys: string[]): string | null {
  for (const key of keys) {
    const escaped = key.replace(':', '\\:').replace('.', '\\.');
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, 'i'),
    ];
    for (const re of patterns) {
      const m = html.match(re);
      if (m?.[1]?.trim()) return decodeEntities(m[1].trim());
    }
    void escaped;
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
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
        const d = await oembedRes.json() as { title?: string; thumbnail_url?: string; author_name?: string };
        const videoId = extractYouTubeId(url);
        // hqdefault always exists; maxresdefault may 404 but browser will fall back gracefully
        const image_url = videoId
          ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          : (d.thumbnail_url ?? null);
        return NextResponse.json({
          title: d.title ?? null,
          description: null,
          image_url,
          source: 'YouTube',
          type: 'video',
        });
      }
    } catch { /* fall through to HTML fetch */ }
  }

  // ── General page ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 });
    }

    // Only read enough HTML to find the <head> — cap at 200 KB
    const reader = res.body?.getReader();
    let html = '';
    if (reader) {
      const decoder = new TextDecoder();
      while (html.length < 200_000) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
        if (html.includes('</head>')) break;
      }
      reader.cancel();
    }

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
