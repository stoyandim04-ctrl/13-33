import { useState, type CSSProperties } from "react";
import { CLAIMS, FLAVOURS } from "../data/flavours";
import { useStore } from "../lib/store";
import { useProgress } from "../lib/scroll";
import { Eyebrow } from "./bits";

/** Кенчето се завърта (сцената), а до него минават четирите числа. */
export function Tour() {
  const { sel } = useStore();
  const f = FLAVOURS[sel];
  const [idx, setIdx] = useState(0);
  const ref = useProgress<HTMLElement>((p) => setIdx(Math.min(CLAIMS.length - 1, Math.floor(p * CLAIMS.length * 0.999))));
  const c = CLAIMS[idx];

  return (
    <section ref={ref} id="tour" data-stage="tour" className="relative h-[420svh]" aria-label="What's inside">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Въртящ се надпис зад кенчето */}
        <div
          className="pointer-events-none absolute top-[30%] right-1/2 z-0 aspect-square w-[min(92vw,62svh)] md:top-1/2 md:right-[22%]"
          style={{ transform: "translate(50%,-50%) rotate(calc(var(--p, 0) * 300deg))" } as CSSProperties}
          aria-hidden
        >
          <svg viewBox="0 0 400 400" className="h-full w-full">
            <defs>
              <path id="ring" d="M200,200 m-170,0 a170,170 0 1,1 340,0 a170,170 0 1,1 -340,0" />
            </defs>
            <circle cx="200" cy="200" r="196" fill="none" stroke="currentColor" strokeWidth="3" />
            <circle cx="200" cy="200" r="140" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 10" />
            <text className="display" fontSize="25" fill="currentColor" letterSpacing="3">
              <textPath href="#ring">FERAL ■ NO SUGAR ■ NO BRAKES ■ FERAL ■ NO SUGAR ■ NO BRAKES ■</textPath>
            </text>
          </svg>
        </div>

        <div data-anchor="tour" className="absolute top-[30%] left-1/2 h-[44svh] w-[16svh] -translate-x-1/2 -translate-y-1/2 md:top-1/2 md:right-[22%] md:left-auto md:h-[70svh] md:w-[26svh] md:translate-x-1/2" aria-hidden />

      </div>

      {/* Пред кенчето — отделен закачен слой, за да е над платното. */}
      <div className="sticky top-0 z-20 -mt-[100svh] h-svh">
        <div className="absolute inset-x-0 bottom-0 px-4 pb-8 sm:px-8 md:top-0 md:bottom-auto md:flex md:h-full md:w-[55%] md:flex-col md:justify-center md:pb-0">
          <Eyebrow n={`0${idx + 1}`} className="mb-3 md:mb-6">
            Inside the can — {CLAIMS.length} numbers
          </Eyebrow>
          <div key={idx} className="slam-in">
            <p className="display flex items-start leading-[0.8]">
              <span className="text-[clamp(6rem,24vw,22rem)] md:text-[clamp(8rem,17vw,22rem)]">{c.big}</span>
              <span className="mt-[0.4em] ml-2 text-[clamp(1.4rem,4vw,3.5rem)]">{c.unit}</span>
            </p>
            <h2 className="display mt-2 text-title md:mt-4">{c.title}</h2>
            <p className="mt-3 max-w-md text-lead font-medium">{c.text}</p>
          </div>
          <div className="mt-6 flex gap-2 md:mt-10" aria-hidden>
            {CLAIMS.map((_, i) => (
              <span key={i} className={`h-2 border-2 border-current transition-all duration-500 ${i === idx ? "w-16 bg-current" : i < idx ? "w-6 bg-current" : "w-6"}`} />
            ))}
          </div>
          <p className="label mt-4 hidden opacity-70 md:block">{f.name} — keep scrolling to see the back</p>
        </div>
      </div>
    </section>
  );
}
