import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import crypto from 'crypto';

export const runtime = 'nodejs';

function sign(params: Record<string, string | number>, secret: string): string {
  const str = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return crypto.createHash('sha256').update(str + secret).digest('hex');
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 503 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'wcsweep-highlights';
  const signature = sign({ folder, timestamp }, apiSecret);

  const upload = new FormData();
  upload.append('file', file);
  upload.append('api_key', apiKey);
  upload.append('timestamp', String(timestamp));
  upload.append('signature', signature);
  upload.append('folder', folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: upload,
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    return NextResponse.json({ error: `Cloudinary error: ${err}` }, { status: 502 });
  }

  const data = await res.json() as { secure_url?: string };
  if (!data.secure_url) {
    return NextResponse.json({ error: 'No URL returned from Cloudinary' }, { status: 502 });
  }

  return NextResponse.json({ url: data.secure_url });
}
