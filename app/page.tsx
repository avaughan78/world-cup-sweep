import { getParticipants, getLastSync, getAllTeamStats, getGroupStandings } from '@/lib/db';
import { computePrizes } from '@/lib/prizes';
import { timeAgo } from '@/lib/format';
import PrizeCard from '@/components/PrizeCard';
import GroupsGrid from '@/components/GroupsGrid';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [participants, lastSync, allTeamStats, groupStandings] = await Promise.all([
    getParticipants(),
    getLastSync('stats'),
    getAllTeamStats(),
    getGroupStandings(),
  ]);

  const participantMap = new Map(participants.map(p => [p.team_name, p.participant_name]));
  const prizes = await computePrizes(participantMap);

  const eliminatedTeams = new Set(
    allTeamStats.filter(t => t.is_eliminated).map(t => t.team_name)
  );

  const inRunning = participants.filter(
    p => p.participant_name && !eliminatedTeams.has(p.team_name)
  ).length;

  const syncedAgo = lastSync ? timeAgo(lastSync) : null;

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl mx-auto px-6">

        {/* Header */}
        <header className="pt-10 pb-0">
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            FIFA World Cup · 2026 · Office Sweepstake
          </p>
          <div className="flex items-baseline justify-between mt-1.5">
            <h1 className="text-6xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>
              The Draw
            </h1>
            <span className="text-base flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--text-muted)' }} />
              {syncedAgo ? `Synced ${syncedAgo}` : 'Not yet synced'}
            </span>
          </div>
          <hr className="mt-5" style={{ borderColor: 'var(--separator)' }} />
        </header>

        <div className="py-10 space-y-10">

          {/* Main prizes */}
          <section>
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Main Prizes
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { ordinal: '1', sup: 'st', label: 'Tournament Winner' },
                { ordinal: '2', sup: 'nd', label: 'Runner-up' },
              ].map(({ ordinal, sup, label }) => (
                <div
                  key={ordinal}
                  className="rounded-xl p-6"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className="text-6xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
                      {ordinal}<sup className="text-3xl">{sup}</sup>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      {label}
                    </span>
                  </div>
                  <p className="text-base" style={{ color: 'var(--text-muted)' }}>Revealed at full time</p>
                </div>
              ))}
            </div>
          </section>

          {/* Novelty prizes */}
          <section>
            <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
              Novelty Prizes
            </p>
            <div className="grid grid-cols-5 gap-3">
              {prizes.map(prize => (
                <PrizeCard key={prize.slug} prize={prize} />
              ))}
            </div>
          </section>

          {/* Groups */}
          <section>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                The Groups · {participants.length} Teams
              </p>
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
                Sync the Google Sheet to populate team names.
              </div>
            ) : (
              <GroupsGrid
                participantMap={Object.fromEntries(participantMap)}
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
