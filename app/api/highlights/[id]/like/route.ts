import { NextRequest, NextResponse } from 'next/server';
import { likeHighlight } from '@/lib/db';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = parseInt(id, 10);
  if (isNaN(numId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  const likes_count = await likeHighlight(numId);
  return NextResponse.json({ likes_count });
}
