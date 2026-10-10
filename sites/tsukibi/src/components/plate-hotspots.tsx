import type { Hotspot } from "../data/menu";

/**
 * Надписите към съставките. Координатите са в % от квадрата на чинията;
 * надписите излизат отляво/отдясно извън чинията, а линиите се „изчертават“.
 */
export function PlateHotspots({ spots, visible }: { spots: Hotspot[]; visible: boolean }) {
  const left = layout(spots.filter((s) => s.x < 50));
  const right = layout(spots.filter((s) => s.x >= 50));
  const all = [...left.map((s) => ({ ...s, side: "l" as const })), ...right.map((s) => ({ ...s, side: "r" as const }))];

  return (
    <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`} aria-hidden={!visible}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
        {all.map((s, i) => {
          const ex = s.side === "l" ? -6 : 106;
          const elbow = s.side === "l" ? Math.min(s.x - 4, 8) : Math.max(s.x + 4, 92);
          const d = `M ${s.x} ${s.y} L ${elbow} ${s.ly} L ${ex} ${s.ly}`;
          return (
            <g key={s.label}>
              <path
                d={d}
                fill="none"
                stroke="rgb(241 233 219 / 0.55)"
                strokeWidth="0.18"
                pathLength={1}
                strokeDasharray="1"
                style={{
                  strokeDashoffset: visible ? 0 : 1,
                  transition: `stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1) ${visible ? 0.08 * i : 0}s`,
                }}
              />
              <circle cx={s.x} cy={s.y} r="0.9" fill="var(--color-ember)" />
              <circle cx={s.x} cy={s.y} r="0.9" fill="none" stroke="var(--color-ember)" strokeWidth="0.2" className="origin-center">
                <animate attributeName="r" values="0.9;3;0.9" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
                <animate attributeName="opacity" values="1;0;1" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
              </circle>
            </g>
          );
        })}
      </svg>
      {all.map((s, i) => (
        <div
          key={s.label}
          className={`absolute w-[8rem] -translate-y-1/2 ${s.side === "l" ? "pr-3 text-right" : "pl-3"}`}
          style={{
            top: `${s.ly}%`,
            ...(s.side === "l" ? { right: "106%" } : { left: "106%" }),
            opacity: visible ? 1 : 0,
            transform: `translateY(-50%) translateX(${visible ? 0 : s.side === "l" ? 10 : -10}px)`,
            transition: `opacity 0.6s ease ${visible ? 0.25 + 0.08 * i : 0}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${visible ? 0.25 + 0.08 * i : 0}s`,
          }}
        >
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-muted">{s.kicker}</p>
          <p className="mt-0.5 font-display text-[1.05rem] leading-tight text-bone">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

/** Подрежда надписите вертикално, за да не се застъпват. */
function layout(spots: Hotspot[]) {
  const sorted = [...spots].sort((a, b) => a.y - b.y).map((s) => ({ ...s, ly: s.y }));
  const gap = 13;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].ly - sorted[i - 1].ly < gap) sorted[i].ly = sorted[i - 1].ly + gap;
  }
  const overflow = sorted.length ? sorted[sorted.length - 1].ly - 94 : 0;
  if (overflow > 0) sorted.forEach((s) => (s.ly -= overflow));
  return sorted;
}
