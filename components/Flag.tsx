import { getFlagUrl } from '@/lib/flags';

export default function Flag({ team, height = '1.2rem' }: { team: string; height?: string }) {
  const url = getFlagUrl(team);
  if (!url) return <span style={{ fontSize: height }}>🏳️</span>;
  return (
    <img
      src={url}
      alt={`${team} flag`}
      style={{ height, width: 'auto', display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    />
  );
}
