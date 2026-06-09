import { getCompanyByCode } from '@/lib/db';
import type { Company } from '@/lib/db';
import DrawPageInner from './DrawPageInner';

export const dynamic = 'force-dynamic';

export default async function DrawPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params.code?.trim().toUpperCase();

  const notFound = (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sweep not found. Check your link and try again.</p>
    </main>
  );

  if (!code) return notFound;
  const company = await getCompanyByCode(code);
  if (!company) return notFound;

  if (!company.tombola_enabled) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-xs">
          <p className="text-3xl mb-4">🔒</p>
          <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Lucky dip not available</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>The organiser hasn&apos;t enabled the online draw for this sweep yet.</p>
          <a href={`/?code=${company.code}`} className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>← Back to sweep</a>
        </div>
      </main>
    );
  }

  return <DrawPageInner company={company} />;
}
