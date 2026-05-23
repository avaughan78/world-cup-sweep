import { getParticipants, getLastSync, getAllTeamStats, getGroupStandings, getCompanyByCode } from '@/lib/db';
import { computePrizes } from '@/lib/prizes';
import SyncTime from '@/components/SyncTime';
import TrophyEasterEgg from '@/components/TrophyEasterEgg';
import PrizeCard from '@/components/PrizeCard';
import TicketBadge from '@/components/TicketBadge';
import GroupsGrid from '@/components/GroupsGrid';
import ThemeToggle from '@/components/ThemeToggle';
import CompanyGate from '@/components/CompanyGate';
import HowItWorksModal from '@/components/HowItWorksModal';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const params = await searchParams;
  const code = params.code?.trim().toUpperCase();

  if (!code) return <CompanyGate />;

  const company = await getCompanyByCode(code);
  if (!company) return <CompanyGate invalidCode />;

  const [participants, lastSync, allTeamStats, groupStandings] = await Promise.all([
    getParticipants(company.id),
    getLastSync('stats'),
    getAllTeamStats(),
    getGroupStandings(),
  ]);

  const participantMap = new Map(participants.map(p => [p.team_name, p.participant_name]));

  // Only reveal names once every slot is filled
  const claimed = participants.filter(p => p.participant_name?.trim()).length;
  const revealed = claimed === participants.length && participants.length > 0;
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">

        {/* Header with image backdrop — constrained to content width */}
        <header
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: '#4D10C8',
            backgroundImage: 'url(/wc2026-header.webp)',
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
          }}
        >
          <div className="px-6 sm:px-8 pt-5 pb-5">
            <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.7)' }}>
              FIFA World Cup · 2026 · {company.name}
            </p>
            <div className="flex items-end justify-between mt-1.5">
              <div className="flex items-end gap-4">
                <TrophyEasterEgg />
                <h1 className="album-title text-4xl sm:text-6xl font-black tracking-tight" style={{ color: '#fff' }}>
                  The Draw
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex text-base items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
                  {lastSync ? <>Synced <SyncTime timestamp={lastSync} /></> : 'Not yet synced'}
                </span>
                <HowItWorksModal claimed={claimed} total={participants.length} />
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
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {prizes.map(prize => {
                const slug = prize.slug === 'top_scorer_team' ? 'top_scorer' : prize.slug;
                const amount = prizeAmounts?.novelty ?? process.env[`PRIZE_${slug.toUpperCase()}`] ?? null;
                return <PrizeCard key={prize.slug} prize={prize} prizeAmount={amount} />;
              })}
            </div>
          </section>

          {/* Groups */}
          <section>
            <div className="flex flex-wrap items-baseline justify-between gap-y-1 mb-3">
              <p className="default-section-label text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                The Groups · {participants.length} Teams
              </p>
              <div className="album-section-label" style={{ marginBottom: 0 }}>
                <span className="label-text">The Draw</span>
                <span className="label-line" />
                <span className="label-note">forty-eight teams</span>
              </div>
              {inRunning > 0 && (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {inRunning} still in the running
                </span>
              )}
            </div>
            {participants.length === 0 ? (
              <div
                className="rounded-xl p-10 text-center text-sm"
                style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                No participants assigned yet — visit the admin panel to set names.
              </div>
            ) : (
              <GroupsGrid
                participantMap={Object.fromEntries(displayMap)}
                eliminatedTeams={[...eliminatedTeams]}
                prizes={prizes}
                groupStandings={groupStandings}
              />
            )}
          </section>

        </div>
      </div>
    </main>

  );
}
