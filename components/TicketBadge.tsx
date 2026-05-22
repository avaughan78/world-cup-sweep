export default function TicketBadge({ amount }: { amount: string }) {
  return (
    <svg width="68" height="40" viewBox="0 0 68 40" style={{ flexShrink: 0 }}>
      <path
        d="M 8,0 L 60,0 Q 68,0 68,8 L 68,15 Q 62,20 68,25 L 68,32 Q 68,40 60,40 L 8,40 Q 0,40 0,32 L 0,25 Q 6,20 0,15 L 0,8 Q 0,0 8,0 Z"
        fill="var(--green)"
      />
      <text x="34" y="14" textAnchor="middle" fill="rgba(255,255,255,0.65)" fontSize="7.5" fontWeight="700" fontFamily="system-ui,sans-serif" letterSpacing="1.5">
        PRIZE
      </text>
      <text x="34" y="29" textAnchor="middle" fill="white" fontSize="13" fontWeight="900" fontFamily="system-ui,sans-serif">
        {amount}
      </text>
    </svg>
  );
}
