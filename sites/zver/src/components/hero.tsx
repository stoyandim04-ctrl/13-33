import { useEffect, useRef, useState } from "react";
import { FLAVOURS } from "../data/flavours";
import { useStore } from "../lib/store";
import { scrollToId } from "../lib/scroll";
import { Tape, TapeWords } from "./bits";

const pad = (n: number) => String(n).padStart(2, "0");

export function Hero({ live }: { live: boolean }) {
  const { sel, setSel } = useStore();
  const f = FLAVOURS[sel];
  const [auto, setAuto] = useState(true);
  const ref = useRef<HTMLElement>(null);

  const pick = (i: number) => {
    setAuto(false);
    setSel(i);
  };

  // Сам сменя вкуса, докато човек не избере нещо.
  useEffect(() => {
    if (!auto || !live) return;
    const id = setInterval(() => {
      const r = ref.current?.getBoundingClientRect();
      if (r && r.bottom > window.innerHeight * 0.6) setSel(sel + 1);
    }, 4200);
    return () => clearInterval(id);
  }, [auto, live, sel, setSel]);

  // ← → докато hero-то е на екрана.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r || r.bottom < window.innerHeight * 0.5) return;
      if ((e.target as HTMLElement)?.closest("input,textarea")) return;
      if (e.key === "ArrowRight") pick(sel + 1);
      if (e.key === "ArrowLeft") pick(sel - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <section ref={ref} id="hero" data-stage="hero" className="relative h-svh min-h-[620px] overflow-x-clip" aria-label="ЗВЯР — енергийна напитка">
      {/* Зад кенчетата */}
      <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center pb-[8svh] select-none">
        <h1 className="display glitch text-mega text-[var(--ink)]" data-text="ЗВЯР">
          ЗВЯР
        </h1>
        <p key={f.id} className="display outline-text slam-in -mt-[1vw] text-[clamp(2rem,8vw,8rem)] leading-none whitespace-nowrap">
          {f.name}
        </p>
      </div>
      {/* Наклонената ивица при смяна */}
      <div key={`w-${sel}`} className="wipe pointer-events-none absolute inset-0 z-[1] bg-[var(--f-acc)]" aria-hidden />

      <div data-anchor="hero" className="absolute top-[42%] left-1/2 h-[44svh] w-[18svh] md:top-[47%] md:h-[58svh] md:w-[22svh] -translate-x-1/2 -translate-y-1/2" aria-hidden />

      {/* Пред кенчетата */}
      <div className="absolute inset-x-0 bottom-14 z-20 flex flex-col gap-6 px-4 sm:bottom-16 sm:px-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm">
          <p className="label mb-2 tabular-nums">
            {pad(sel + 1)} / {pad(FLAVOURS.length)} — {f.fruit}
          </p>
          <p key={f.id} className="slam-in mb-5 hidden text-body font-semibold sm:block">
            {f.line}
          </p>
          <button type="button" className="btn-main" onClick={() => scrollToId("shop")}>
            Вземи {f.name} <span aria-hidden>→</span>
          </button>
        </div>

        <div className="flex items-center gap-2" role="radiogroup" aria-label="Вкус">
          <button type="button" className="slab label grid h-11 w-11 place-items-center bg-bone text-black" onClick={() => pick(sel - 1)} aria-label="Предишен вкус">
            ←
          </button>
          {FLAVOURS.map((x, i) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={i === sel}
              aria-label={`${x.name} — ${x.fruit}`}
              onClick={() => pick(i)}
              className={`h-11 border-[3px] border-[var(--f-ink)] transition-all duration-300 ease-[var(--ease-slam)] ${i === sel ? "w-16 shadow-[4px_4px_0_#0a0a0a]" : "w-7 hover:-translate-y-1"}`}
              style={{ background: x.can }}
            />
          ))}
          <button type="button" className="slab label grid h-11 w-11 place-items-center bg-bone text-black" onClick={() => pick(sel + 1)} aria-label="Следващ вкус">
            →
          </button>
        </div>
      </div>

      <Tape className="label absolute inset-x-[-2%] bottom-0 z-20 -rotate-1 bg-black py-3 text-[var(--f-hi)]" speed={26}>
        <TapeWords words={["160 мг кофеин", "0 г захар", "12% плодов сок", "500 мл", "Не е за деца", "ЗВЯР"]} />
      </Tape>
    </section>
  );
}
