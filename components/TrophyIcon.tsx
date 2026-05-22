export default function TrophyIcon({ size = 64 }: { size?: number }) {
  // Aspect ratio: viewBox 60×74
  const h = Math.round(size * 74 / 60);
  return (
    <svg width={size} height={h} viewBox="0 0 60 74" fill="none" aria-hidden="true">
      {/* Globe at the top — the defining feature of the FIFA WC trophy */}
      <circle cx="30" cy="12" r="11" fill="currentColor" />
      <ellipse cx="30" cy="12" rx="11" ry="4.2" fill="none" stroke="white" strokeWidth="1.1" opacity="0.3" />
      <line x1="30" y1="1" x2="30" y2="23" stroke="white" strokeWidth="1.1" opacity="0.3" />
      <ellipse cx="30" cy="12" rx="6" ry="11" fill="none" stroke="white" strokeWidth="0.9" opacity="0.2" />

      {/*
        Trophy body: two abstract figures with arms raised holding the globe.
        The key shape: narrow at the top (where hands meet the globe),
        flares outward (the arms/shoulders), then tapers back in toward the base.
        This makes the body visibly WIDER than the globe — the WC trophy's
        distinctive silhouette vs any generic trophy.
      */}
      <path
        d="M 22,22 C 14,24 4,32 4,42 C 4,51 11,56 19,57 L 19,61 L 41,61 L 41,57 C 49,56 56,51 56,42 C 56,32 46,24 38,22 Q 34,21 30,21 Q 26,21 22,22 Z"
        fill="currentColor"
      />

      {/* Subtle centre groove suggesting two separate figures */}
      <line x1="30" y1="23" x2="30" y2="60" stroke="white" strokeWidth="1.5" opacity="0.12" />

      {/* Upper base platform */}
      <rect x="15" y="61" width="30" height="5" rx="2.5" fill="currentColor" />
      {/* Lower base */}
      <rect x="7" y="66" width="46" height="7" rx="3.5" fill="currentColor" />
    </svg>
  );
}
