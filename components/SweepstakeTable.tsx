import type { Prize } from '@/lib/prizes';
import type { Participant } from '@/lib/db';

const PRIZE_ICONS: Record<string, string> = {
  most_cards: '🟨',
  first_eliminated: '✈️',
  longest_shot: '🚀',
  most_own_goals: '😬',
  top_scorer_team: '👟',
};

export default function SweepstakeTable({
  participants,
  prizes,
}: {
  participants: Participant[];
  prizes: Prize[];
}) {
  // Map team → prizes currently won
  const teamPrizes = new Map<string, Prize[]>();
  for (const prize of prizes) {
    if (!prize.current_team) continue;
    const existing = teamPrizes.get(prize.current_team) ?? [];
    existing.push(prize);
    teamPrizes.set(prize.current_team, existing);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-800/80 text-left">
            <th className="px-4 py-3 text-slate-400 font-semibold">Team</th>
            <th className="px-4 py-3 text-slate-400 font-semibold">Name</th>
            <th className="px-4 py-3 text-slate-400 font-semibold">Leading</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((p, i) => {
            const wonPrizes = teamPrizes.get(p.team_name) ?? [];
            const isLeading = wonPrizes.length > 0;

            return (
              <tr
                key={p.team_name}
                className={[
                  'border-b border-slate-800 last:border-0',
                  i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60',
                  isLeading ? 'ring-1 ring-inset ring-amber-500/20' : '',
                ].join(' ')}
              >
                <td className="px-4 py-2.5 font-medium text-white whitespace-nowrap">
                  {p.team_name}
                </td>
                <td className="px-4 py-2.5 text-slate-300">
                  {p.participant_name ?? (
                    <span className="text-slate-600 italic text-xs">TBD</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5 flex-wrap">
                    {wonPrizes.map(prize => (
                      <span
                        key={prize.slug}
                        title={prize.name}
                        className="text-base leading-none"
                      >
                        {PRIZE_ICONS[prize.slug]}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
