export default function TrophyIcon({ size = 64 }: { size?: number }) {
  const h = Math.round(size * 1.2);
  return (
    <svg width={size} height={h} viewBox="0 0 56 68" fill="none" aria-hidden="true">
      {/* Globe */}
      <circle cx="28" cy="20" r="18" fill="currentColor" />
      {/* Equatorial band */}
      <ellipse cx="28" cy="20" rx="18" ry="6.5" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3" />
      {/* Upper latitude */}
      <ellipse cx="28" cy="13.5" rx="12.5" ry="4" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />
      {/* Lower latitude */}
      <ellipse cx="28" cy="26.5" rx="12.5" ry="4" fill="none" stroke="white" strokeWidth="1" opacity="0.2" />
      {/* Central meridian */}
      <line x1="28" y1="2" x2="28" y2="38" stroke="white" strokeWidth="1.4" opacity="0.28" />
      {/* Offset meridian ellipse */}
      <ellipse cx="28" cy="20" rx="9.5" ry="18" fill="none" stroke="white" strokeWidth="1" opacity="0.15" />
      {/* Tapered stem */}
      <path d="M 25.5,37 L 23.5,54 L 32.5,54 L 30.5,37 Z" fill="currentColor" />
      {/* Upper base */}
      <rect x="16" y="54" width="24" height="5" rx="2.5" fill="currentColor" />
      {/* Main base */}
      <rect x="9" y="59" width="38" height="9" rx="4.5" fill="currentColor" />
    </svg>
  );
}
