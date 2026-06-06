export type ParsedVideo = { type: 'youtube' | 'vimeo' | 'direct'; embedSrc: string };

export function parseVideoUrl(url: string, opts?: { muted?: boolean }): ParsedVideo {
  const muted = opts?.muted ?? false;

  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) {
    const tMatch = url.match(/[?&]t=(\d+)/);
    const start = tMatch ? `&start=${tMatch[1]}` : '';
    const muteParam = muted ? '&mute=1' : '';
    return { type: 'youtube', embedSrc: `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&playsinline=1${start}${muteParam}` };
  }

  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) {
    const muteParam = muted ? '&muted=1' : '';
    return { type: 'vimeo', embedSrc: `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1${muteParam}` };
  }

  return { type: 'direct', embedSrc: url };
}
