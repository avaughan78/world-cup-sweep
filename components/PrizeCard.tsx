import type { Prize } from '@/lib/prizes';
import { getFlag } from '@/lib/flags';

export default function PrizeCard({ prize }: { prize: Prize }) {
  const hasLeader = !!prize.current_team;

  return (
    <div
      className={`rounded-2xl p-5 border transition-all ${
        hasLeader
          ? 'bg-slate-800 border-slate-600'
          : 'bg-slate-800/30 border-slate-700/50'
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-3xl leading-none">{prize.icon}</span>
        <div>
          <div className="font-bold text-white leading-tight">{prize.name}</div>
          <div className="text-slate-500 text-xs mt-0.5">{prize.description}</div>
        </div>
      </div>

      {hasLeader ? (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="text-lg font-bold text-white">
            <span className="mr-1.5">{getFlag(prize.current_team!)}</span>{prize.current_team}
          </div>
          {prize.current_participant ? (
            <div className="text-amber-400 font-semibold text-sm">{prize.current_participant}</div>
          ) : (
            <div className="text-slate-500 text-sm italic">Draw pending</div>
          )}
          {prize.value_label && (
            <div className="text-slate-400 text-xs mt-1.5 font-mono">{prize.value_label}</div>
          )}
          {prize.is_manual && (
            <div className="text-slate-600 text-xs mt-1">✎ manually set</div>
          )}
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-slate-700/50 text-slate-600 text-sm">
          No leader yet
        </div>
      )}
    </div>
  );
}
