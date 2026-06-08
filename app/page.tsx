import { getParticipants, getLastSync, getAllTeamStats, getGroupStandings, getCompanyByCode } from '@/lib/db';
import { computePrizes } from '@/lib/prizes';
import SyncTime from '@/components/SyncTime';
import TrophyEasterEgg from '@/components/TrophyEasterEgg';
import PrizeCard from '@/components/PrizeCard';
import TicketBadge from '@/components/TicketBadge';
import GroupsSection from '@/components/GroupsSection';
import ThemeToggle from '@/components/ThemeToggle';
import BugReport from '@/components/BugReport';
import CompanyGate from '@/components/CompanyGate';
import HowItWorksModal from '@/components/HowItWorksModal';
import PoweredByLink from '@/components/PoweredByLink';
import HomeExitLink from '@/components/HomeExitLink';
import { headers } from 'next/headers';
import { writeAudit } from '@/lib/audit';
import { TOURNAMENT_START } from '@/lib/groups';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  if (params.code) return { robots: { index: false, follow: false } };
  return {};
}

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params.code?.trim().toUpperCase();

  if (!code) return <CompanyGate marketing />;

  const company = await getCompanyByCode(code);
  if (!company) return <CompanyGate invalidCode marketing />;

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  const [participants, lastSync, allTeamStats, groupStandings] = await Promise.all([
    getParticipants(company.id),
    getLastSync('stats'),
    getAllTeamStats(),
    getGroupStandings(),
  ]);


  const participantMap = new Map(participants.map(p => [p.team_name, p.participant_name]));

  const claimed = participants.filter(p => p.participant_name?.trim()).length;
  const tournamentStarted = Date.now() >= TOURNAMENT_START.getTime();
  const revealed = tournamentStarted || (claimed === participants.length && participants.length > 0);
  const displayMap = revealed
    ? participantMap
    : new Map(participants.map(p => [p.team_name, null]));

  const prizes = await computePrizes(displayMap, company.id);

  function formatPrize(n: number): string {
    return `£${n % 1 === 0 ? n : n.toFixed(2)}`;
  }
  const prizeAmounts = company.ticket_price
    ? (() => {
        const pot = company.ticket_price * participants.length;
        return {
          first:   formatPrize(pot * 0.50),
          second:  formatPrize(pot * 0.25),
          novelty: formatPrize(pot * 0.05),
        };
      })()
    : null;

  const eliminatedTeams = new Set(
    allTeamStats.filter(t => t.is_eliminated).map(t => t.team_name)
  );

  const inRunning = revealed
    ? participants.filter(p => p.participant_name && !eliminatedTeams.has(p.team_name)).length
    : 0;

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      <div className="max-w-[1080px] mx-auto px-4 sm:px-6 pt-6">

        {/* Header with image backdrop — constrained to content width */}
        <header
          className="relative rounded-2xl overflow-hidden"
          style={{
            backgroundImage: 'url(/wc2026-header-bg.png)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}
        >
          <div className="px-6 sm:px-8 pt-3 pb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
                FIFA World Cup · 2026 · {company.name}
              </p>
              <HomeExitLink />
            </div>
            <div className="flex items-end justify-between mt-1">
              <div className="flex items-end gap-4">
                <TrophyEasterEgg />
                <h1 className="album-title text-4xl sm:text-6xl font-black tracking-tight" style={{ color: '#fff' }}>
                  WC26 Sweep
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex text-base items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
                  {lastSync ? <>Synced <SyncTime timestamp={lastSync} /></> : 'Not yet synced'}
                </span>
                <HowItWorksModal claimed={claimed} total={participants.length} ticketPrice={company.ticket_price} />
                <a
                  href={`/manage?code=${company.code}`}
                  aria-label="Organiser admin"
                  title="Organiser admin"
                  className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
                  style={{
                    width: '1.75rem', height: '1.75rem',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                  </svg>
                </a>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        <div className="py-10 space-y-10">

          {/* Main prizes */}
          <section>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { ordinal: '1', sup: 'st', label: 'Tournament Winner', amount: prizeAmounts?.first   ?? process.env.PRIZE_1ST ?? null },
                { ordinal: '2', sup: 'nd', label: 'Runner-up',         amount: prizeAmounts?.second  ?? process.env.PRIZE_2ND ?? null },
              ].map(({ ordinal, sup, label, amount }) => (
                <div
                  key={ordinal}
                  className="main-prize-card rounded-xl p-6"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="prize-ordinal text-6xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                      {ordinal}<sup className="text-3xl">{sup}</sup>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {amount && <TicketBadge amount={amount} />}
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                        {label}
                      </span>
                    </div>
                  </div>
                  <p className="text-base" style={{ color: 'var(--text-muted)' }}>Pending the final</p>
                </div>
              ))}
            </div>
          </section>

          {/* Novelty prizes */}
          <section className="space-y-4">
            {/* Cash prizes — row of 5 */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {prizes.filter(p => !p.mystery && !p.hidden).map(prize => {
                const slug = prize.slug === 'top_scorer_team' ? 'top_scorer' : prize.slug;
                const amount = prizeAmounts?.novelty ?? process.env[`PRIZE_${slug.toUpperCase()}`] ?? null;
                return <PrizeCard key={prize.slug} prize={prize} prizeAmount={amount} />;
              })}
            </div>
            {/* Mystery prizes — flex row, truly centred */}
            <div className="flex justify-center gap-3 flex-wrap">
              {prizes.filter(p => p.mystery && !p.hidden).map(prize => (
                <div key={prize.slug} className="w-[calc(50%-0.375rem)] sm:w-[calc(20%-0.6rem)]">
                  <PrizeCard prize={prize} prizeAmount={null} />
                </div>
              ))}
            </div>
          </section>

          {/* Names hidden notice */}
          {!revealed && participants.length > 0 && (
            <div
              className="rounded-xl px-5 py-4 flex items-center gap-3"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <span className="text-lg flex-shrink-0">🔒</span>
              <p className="text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Names are hidden until everyone has claimed their team.{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{claimed} of {participants.length}</strong> claimed so far.
              </p>
            </div>
          )}

          {/* Groups / Fixtures */}
          {participants.length === 0 ? (
            <section>
              <div
                className="rounded-xl p-10 text-center text-sm"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                No participants assigned yet — visit the admin panel to set names.
              </div>
            </section>
          ) : (
            <GroupsSection
              participantMap={Object.fromEntries(displayMap)}
              eliminatedTeams={[...eliminatedTeams]}
              prizes={prizes}
              groupStandings={groupStandings}
              teamCount={participants.length}
              inRunning={inRunning}
            />
          )}

        </div>

        <footer className="pb-8">
          <div className="relative text-center">
            <BugReport />
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              <PoweredByLink />
            </div>
          </div>
        </footer>

      </div>
    </main>

  );
}
