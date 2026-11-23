/** The round progress graph on a coloured header: the ring with the percentage, nothing beside it. */
export function HeroProgress({ pct, label, size = 112 }: { pct: number; /** Read out by screen readers, e.g. "5 מתוך 8 הושלמו". */ label?: string; size?: number }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <svg width={size} height={size} viewBox="0 0 62 62" role="img" aria-label={label ? `${p}% · ${label}` : `${p}% הושלם`} className="self-center lg:self-auto shrink-0">
      <circle cx="31" cy="31" r="26" fill="rgba(255,255,255,.08)" stroke="rgba(255,255,255,.25)" strokeWidth="6" />
      {p > 0 && (
        <circle cx="31" cy="31" r="26" fill="none" stroke="#e9b44c" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(p / 100) * 163.4} 163.4`} transform="rotate(-90 31 31)" />
      )}
      <text x="31" y="36" textAnchor="middle" fill="#fff" className="font-rubik" fontSize="15" fontWeight="700">
        {p}%
      </text>
    </svg>
  );
}
