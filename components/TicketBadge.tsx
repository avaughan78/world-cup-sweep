export default function TicketBadge({ amount }: { amount: string }) {
  return (
    <svg width="68" height="34" viewBox="0 0 52 26" style={{ flexShrink: 0 }}>
      {amount === '?' && <title>Mystery prize...</title>}
      <path
        d="M 5,0 L 47,0 Q 52,0 52,5 L 52,10 Q 48,13 52,16 L 52,21 Q 52,26 47,26 L 5,26 Q 0,26 0,21 L 0,16 Q 4,13 0,10 L 0,5 Q 0,0 5,0 Z"
        fill="#f5f0e4"
        stroke="#c8c0ac"
        strokeWidth="1"
      />
      <text x="26" y="14" textAnchor="middle" dominantBaseline="middle" fill="#1a1a17" fontSize="11" fontWeight="900" fontFamily="system-ui,sans-serif">
        {amount}
      </text>
    </svg>
  );
}
