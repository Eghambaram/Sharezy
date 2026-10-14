/**
 * Original flat line illustrations for DataExchange (PROMPT.md §10).
 * Decorative only: aria-hidden, colours from tokens.
 */

export function SkylineIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" className={className} aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <g className="fill-primary-soft">
        <rect x="20" y="50" width="46" height="70" rx="3" />
        <rect x="74" y="28" width="40" height="92" rx="3" />
        <rect x="122" y="62" width="34" height="58" rx="3" />
        <rect x="236" y="40" width="44" height="80" rx="3" />
        <rect x="288" y="18" width="38" height="102" rx="3" />
        <rect x="334" y="56" width="46" height="64" rx="3" />
      </g>
      <g className="fill-accent-soft">
        <rect x="164" y="34" width="64" height="86" rx="4" />
      </g>
      <g className="fill-card">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2].map((c) => <rect key={`${r}-${c}`} x={172 + c * 18} y={44 + r * 16} width="10" height="8" rx="1.5" />),
        )}
        {[0, 1, 2, 3, 4].map((r) => (
          <rect key={`t${r}`} x="82" y={38 + r * 15} width="24" height="7" rx="1.5" />
        ))}
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <rect key={`u${r}`} x="296" y={28 + r * 14} width="22" height="6" rx="1.5" />
        ))}
      </g>
      <g className="fill-accent" opacity="0.35">
        <circle cx="12" cy="112" r="8" />
        <circle cx="390" cy="110" r="10" />
        <circle cx="206" cy="116" r="5" />
      </g>
      <rect x="0" y="118" width="400" height="2" className="fill-border" />
    </svg>
  );
}

export function WelcomeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} aria-hidden="true">
      <circle cx="120" cy="84" r="70" className="fill-accent-soft" />
      {/* Profile card */}
      <rect x="62" y="38" width="116" height="84" rx="12" className="fill-card stroke-border" strokeWidth="2" />
      <circle cx="88" cy="66" r="12" className="fill-primary-soft" />
      <rect x="108" y="58" width="52" height="6" rx="3" className="fill-primary" opacity="0.8" />
      <rect x="108" y="70" width="36" height="5" rx="2.5" className="fill-border" />
      {/* Field rows with toggles */}
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x="76" y={88 + i * 16} width="54" height="5" rx="2.5" className="fill-border" />
          <rect x="140" y={85 + i * 16} width="22" height="11" rx="5.5" className={i === 0 ? "fill-accent" : "fill-border"} />
          <circle cx={i === 0 ? 156 : 146} cy={90.5 + i * 16} r="4" className="fill-card" />
        </g>
      ))}
      {/* Shield */}
      <path d="M186 30l18 7v13c0 11-8 19-18 22-10-3-18-11-18-22V37l18-7Z" className="fill-primary" />
      <path d="M179 51l5 5 10-11" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
    </svg>
  );
}

/** Person sitting with a tablet among leaves (customer welcome; original artwork). */
export function PersonWithTabletIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 170" className={className} aria-hidden="true">
      <ellipse cx="130" cy="160" rx="120" ry="8" className="fill-surface-2" />
      {/* Leaves, left */}
      <g className="fill-accent" opacity="0.55">
        <path d="M40 160c-6-30 4-58 22-74-2 26-8 52-22 74Z" />
        <path d="M52 160c4-24 18-42 38-50-8 20-20 38-38 50Z" />
        <path d="M30 160c-14-18-18-40-12-60 10 18 14 40 12 60Z" />
      </g>
      {/* Leaves, right */}
      <g className="fill-accent" opacity="0.4">
        <path d="M222 160c6-28-2-54-18-70 0 24 6 48 18 70Z" />
        <path d="M210 160c-4-22-16-38-34-46 6 18 18 34 34 46Z" />
        <path d="M234 160c12-16 16-36 10-54-10 16-12 36-10 54Z" />
      </g>
      {/* Chat bubble with check */}
      <rect x="70" y="20" width="34" height="22" rx="7" className="fill-accent-soft" />
      <path d="M80 31l4 4 9-8" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-accent" />
      {/* Body */}
      <path d="M108 160c0-28 10-50 26-50s26 22 26 50Z" className="fill-card stroke-border" strokeWidth="2" />
      {/* Hair (back) */}
      <path d="M118 74c0-18 10-30 24-30s22 12 22 30c0 14-2 30-8 40h-32c-5-10-6-26-6-40Z" className="fill-primary" />
      {/* Face */}
      <circle cx="140" cy="76" r="15" className="fill-warning-soft" />
      {/* Hair (fringe) */}
      <path d="M124 72c4-12 12-18 22-18 8 0 14 6 16 14-12-2-26 0-38 4Z" className="fill-primary" />
      {/* Arm + tablet */}
      <rect x="96" y="118" width="40" height="28" rx="4" transform="rotate(-12 116 132)" className="fill-primary" />
      <rect x="100" y="121" width="32" height="22" rx="2" transform="rotate(-12 116 132)" className="fill-primary-soft" />
      <path d="M150 124c-8 6-16 10-26 12" fill="none" strokeWidth="7" strokeLinecap="round" className="stroke-warning-soft" />
    </svg>
  );
}
