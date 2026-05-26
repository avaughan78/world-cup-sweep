import { getFlagUrl } from '@/lib/flags';

export default function Flag({ team, height = '1.2rem', width }: { team: string; height?: string; width?: string }) {
  const url = getFlagUrl(team);
  if (width) {
    if (!url) return <span style={{ fontSize: height, display: 'inline-block', width, textAlign: 'center', verticalAlign: 'middle', flexShrink: 0 }}>🏳️</span>;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width, height, flexShrink: 0, verticalAlign: 'middle' }}>
        <img src={url} alt={`${team} flag`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
      </span>
    );
  }
  if (!url) return <span style={{ fontSize: height }}>🏳️</span>;
  return (
    <img
      src={url}
      alt={`${team} flag`}
      style={{ height, width: 'auto', display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    />
  );
}
