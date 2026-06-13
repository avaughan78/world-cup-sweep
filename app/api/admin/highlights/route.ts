import { NextRequest, NextResponse } from 'next/server';
import { getHighlights, createHighlight, deleteHighlight, updateHighlightOrder } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

function safeUrl(val: string | undefined): string | null {
  if (!val?.trim()) return null;
  try {
    const u = new URL(val.trim());
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const highlights = await getHighlights();
  return NextResponse.json({ highlights });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const body = await req.json() as {
    title?: string; url?: string; image_url?: string; description?: string;
    source?: string; type?: string; display_order?: number;
  };
  if (!body.title?.trim()) return NextResponse.json({ error: 'title required' }, { status: 400 });
  const url = safeUrl(body.url);
  if (!url) return NextResponse.json({ error: 'valid url required' }, { status: 400 });
  const highlight = await createHighlight({
    title: body.title.trim(),
    url,
    image_url: safeUrl(body.image_url),
    description: body.description?.trim() || null,
    source: body.source?.trim() || null,
    type: body.type === 'video' ? 'video' : 'article',
    display_order: typeof body.display_order === 'number' ? body.display_order : 0,
  });
  return NextResponse.json({ ok: true, highlight });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id } = await req.json() as { id?: number };
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await deleteHighlight(id);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;
  const { id, display_order } = await req.json() as { id?: number; display_order?: number };
  if (!id || display_order == null) return NextResponse.json({ error: 'id and display_order required' }, { status: 400 });
  await updateHighlightOrder(id, display_order);
  return NextResponse.json({ ok: true });
}
