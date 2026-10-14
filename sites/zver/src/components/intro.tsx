import { useEffect, useState } from "react";

/**
 * Интро: ЗВЯР се забива буква по буква, броячът стига 100, когато сцената е
 * готова, и екранът се разцепва на две — отдолу падат кенчетата.
 */
export function Intro({ ready, onOpen }: { ready: boolean; onOpen: () => void }) {
  const [n, setN] = useState(0);
  const [phase, setPhase] = useState<"count" | "split" | "gone">("count");
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const start = performance.now();
    const min = reduced ? 200 : 1500;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / min);
      // Без готова сцена броячът спира на 87.
      const v = Math.round((ready ? k : Math.min(k, 0.87)) * 100);
      setN(v);
      if (v >= 100) {
        setPhase("split");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready, reduced]);

  useEffect(() => {
    if (phase !== "split") return;
    onOpen();
    const t = setTimeout(() => setPhase("gone"), reduced ? 50 : 900);
    return () => clearTimeout(t);
  }, [phase, onOpen, reduced]);

  if (phase === "gone") return null;
  const split = phase === "split";
  const half = "absolute inset-x-0 bg-black transition-transform duration-[850ms] ease-[cubic-bezier(0.8,0,0.2,1)]";

  return (
    <div className="fixed inset-0 z-[90] text-bone" aria-hidden>
      <div className={`${half} top-0 h-1/2 ${split ? "-translate-y-full" : ""}`} />
      <div className={`${half} bottom-0 h-1/2 ${split ? "translate-y-full" : ""}`} />
      <div className={`absolute inset-0 grid place-items-center transition-opacity duration-200 ${split ? "opacity-0" : ""}`}>
        <div className="display flex text-[clamp(4.5rem,22vw,20rem)] leading-none">
          {"FERAL".split("").map((ch, i) => (
            <span key={i} className="slam-in inline-block" style={{ animationDelay: `${0.12 + i * 0.13}s` }}>
              {ch}
            </span>
          ))}
        </div>
        <div className="label absolute bottom-6 left-5 right-5 flex justify-between sm:bottom-8 sm:left-8 sm:right-8">
          <span>Waking the beast</span>
          <span className="tabular-nums">{String(n).padStart(3, "0")}</span>
        </div>
        <div className="absolute bottom-0 left-0 h-1.5 bg-[var(--f-bg)]" style={{ width: `${n}%` }} />
      </div>
    </div>
  );
}
