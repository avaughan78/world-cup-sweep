import { getParticipants, getLastSync } from '@/lib/db';
import { computePrizes } from '@/lib/prizes';
import PrizeCard from '@/components/PrizeCard';
import SweepstakeTable from '@/components/SweepstakeTable';

export const dynamic = 'force-dynamic'; // always fetch fresh data from DB

export default async function Home() {
  const participants = await getParticipants();
  const participantMap = new Map(participants.map(p => [p.team_name, p.participant_name]));
  const [prizes, lastSync] = await Promise.all([
    computePrizes(participantMap),
    getLastSync('stats'),
  ]);

  const lastUpdated = lastSync
    ? new Date(lastSync).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <header className="bg-gradient-to-b from-green-900 to-green-950 border-b border-green-800 py-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-4xl font-black tracking-tight">World Cup 2026</h1>
          <p className="text-green-300 text-lg font-medium mt-1">Office Sweepstake</p>
          <p className="text-green-600 text-xs mt-3">
            {lastUpdated ? `Stats updated ${lastUpdated}` : 'Waiting for first sync'}
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            🏆 Main Prizes
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {['1st Place', '2nd Place'].map(label => (
              <div
                key={label}
                className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 text-center"
              >
                <div className="text-2xl mb-2">🏆</div>
                <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">
                  {label}
                </div>
                <div className="text-slate-500 font-semibold">Revealed at full time</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            🎯 Novelty Prizes
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {prizes.map(prize => (
              <PrizeCard key={prize.slug} prize={prize} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            📋 The Draw
          </h2>
          {participants.length === 0 ? (
            <div className="text-slate-500 text-center py-8 rounded-2xl border border-slate-700">
              Waiting for draw data — sync the Google Sheet to populate names.
            </div>
          ) : (
            <SweepstakeTable participants={participants} prizes={prizes} />
          )}
        </section>
      </div>
    </main>
  );
}
