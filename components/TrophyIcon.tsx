export default function TrophyIcon({ size = 52 }: { size?: number }) {
  // viewBox 56×76
  const h = Math.round(size * 76 / 56);
  return (
    <svg width={size} height={h} viewBox="0 0 56 76" fill="none" aria-hidden="true">
      <defs>
        {/* Left-to-right gold gradient shared across body and base elements */}
        <linearGradient id="wc-gold" x1="4" y1="0" x2="52" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#7a5800" />
          <stop offset="22%"  stopColor="#c49010" />
          <stop offset="45%"  stopColor="#ffe45a" />
          <stop offset="68%"  stopColor="#c8940e" />
          <stop offset="100%" stopColor="#6a4c00" />
        </linearGradient>
        {/* Radial highlight for globe */}
        <radialGradient id="wc-globe" cx="24" cy="8" r="13" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#fff5a0" />
          <stop offset="40%"  stopColor="#f0c830" />
          <stop offset="100%" stopColor="#7a5800" />
        </radialGradient>
        {/* Malachite green */}
        <linearGradient id="wc-malachite" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#228b55" />
          <stop offset="50%"  stopColor="#2db870" />
          <stop offset="100%" stopColor="#1a6b40" />
        </linearGradient>
      </defs>

      {/*
        Body: two abstract figures with arms raised holding the globe.
        Rendered before the globe so the globe covers the junction cleanly.
        Key: body is WIDER than the globe — the defining feature of the WC trophy.
      */}
      <path
        d="M 22,19 C 13,23 4,32 4,41 C 4,49 9,53 17,54 L 39,54 C 47,53 52,49 52,41 C 52,32 43,23 34,19 Z"
        fill="url(#wc-gold)"
      />
      {/* Left-side highlight to suggest cylindrical form */}
      <path
        d="M 22,20 C 15,24 9,32 9,40 C 9,47 12,51 18,53"
        stroke="rgba(255,240,130,0.45)" strokeWidth="2.5" strokeLinecap="round"
      />

      {/* Malachite band — the distinctive dark-green ring between body and base */}
      <rect x="15" y="54" width="26" height="7" rx="1" fill="url(#wc-malachite)" />
      {/* Malachite sheen */}
      <rect x="15" y="54" width="26" height="2.5" rx="1" fill="rgba(255,255,255,0.13)" />

      {/* Upper base step */}
      <rect x="9" y="61" width="38" height="6" rx="2" fill="url(#wc-gold)" />
      <rect x="9" y="61" width="38" height="1.8" rx="2" fill="rgba(255,240,130,0.28)" />

      {/* Lower base — widest element */}
      <rect x="3" y="67" width="50" height="8" rx="3.5" fill="url(#wc-gold)" />
      <rect x="3" y="67" width="50" height="2" rx="3.5" fill="rgba(255,240,130,0.22)" />

      {/* Globe — rendered last so it sits cleanly on top of the body */}
      <circle cx="28" cy="12" r="11" fill="url(#wc-globe)" />
      {/* Globe geographic grid */}
      <ellipse cx="28" cy="12" rx="11" ry="4.2" fill="none" stroke="rgba(100,75,0,0.4)" strokeWidth="0.9" />
      <ellipse cx="28" cy="8"  rx="7"  ry="2.5" fill="none" stroke="rgba(100,75,0,0.28)" strokeWidth="0.7" />
      <ellipse cx="28" cy="16" rx="7"  ry="2.5" fill="none" stroke="rgba(100,75,0,0.28)" strokeWidth="0.7" />
      <line x1="28" y1="1" x2="28" y2="23" stroke="rgba(100,75,0,0.38)" strokeWidth="0.9" />
      <ellipse cx="28" cy="12" rx="6"  ry="11"  fill="none" stroke="rgba(100,75,0,0.22)" strokeWidth="0.7" />
      {/* Globe specular highlight */}
      <ellipse cx="24" cy="8.5" rx="4" ry="2.8" fill="rgba(255,255,210,0.4)" />
    </svg>
  );
}
