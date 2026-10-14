import { useRef } from "react";
import { useProgress } from "../lib/scroll";
import { stageRef } from "../lib/stage-ref";
import { Tape, TapeWords } from "./bits";

/**
 * Кенчето трепери все по-силно („Дръж се.“), на 30% се пръска — бяла светкавица,
 * резенчета, лед и капки летят към екрана (сцената), а отзад се забива ПУСНАТ.
 */
export function Burst() {
  const fired = useRef(false);
  const ref = useProgress<HTMLElement>((p) => {
    if (p > 0.3 && !fired.current) {
      fired.current = true;
      stageRef.current?.kick(1.4);
      navigator.vibrate?.(40);
    }
    if (p < 0.25) fired.current = false;
  });


  return (
    <section ref={ref} id="burst" data-stage="burst" className="relative h-[300svh]" aria-label="Звярът е пуснат">
      <div className="sticky top-0 h-svh overflow-hidden">
        {/* Преди: ДРЪЖ СЕ. */}
        <div
          className="pointer-events-none absolute inset-0 z-0 grid place-items-center"
          style={{
            opacity: "clamp(0, calc((0.3 - var(--p, 0)) * 14), 1)",
            transform: "scale(calc(0.85 + var(--p, 0) * 1.2))",
          }}
        >
          <p className="display text-center text-[clamp(4rem,19vw,20rem)] leading-[0.8]">
            ДРЪЖ
            <br />
            <span className="outline-text">СЕ.</span>
          </p>
        </div>

        {/* След: ПУСНАТ. */}
        <div
          className="pointer-events-none absolute inset-0 z-0 grid place-items-center"
          style={{
            opacity: "clamp(0, calc((var(--p, 0) - 0.3) * 30), 1)",
            transform: "scale(calc(1.6 - clamp(0, calc((var(--p, 0) - 0.3) * 5), 1) * 0.6))",
          }}
        >
          <div className="text-center">
            <p className="label mb-4">Звярът е</p>
            <p className="display text-[clamp(3.6rem,17vw,19rem)] leading-[0.8]">ПУСНАТ.</p>
            <p className="display mt-4 text-[clamp(1rem,2.6vw,2.4rem)]">Без захар. Без спирачки.</p>
          </div>
        </div>

        {/* Кръстосаните ленти — идват след удара. */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{ opacity: "clamp(0, calc((var(--p, 0) - 0.34) * 8), 1)" }}
          aria-hidden
        >
          <Tape className="display absolute top-[18%] left-[-10%] w-[120%] rotate-[-7deg] bg-black py-3 text-xl text-[var(--f-hi)] md:text-3xl" speed={18}>
            <TapeWords words={["ЗВЯР", "Без захар", "Без спирачки", "160 мг"]} />
          </Tape>
          <Tape className="display absolute bottom-[16%] left-[-10%] w-[120%] rotate-[6deg] border-y-[3px] border-black bg-bone py-3 text-xl text-black md:text-3xl" speed={20} reverse>
            <TapeWords words={["Не е за деца", "Дръж се", "ЗВЯР", "Пусни го"]} />
          </Tape>
        </div>

        <div data-anchor="burst" className="absolute top-1/2 left-1/2 h-[46svh] w-[18svh] md:h-[56svh] md:w-[20svh] -translate-x-1/2 -translate-y-1/2" aria-hidden />

      </div>

      {/* Светкавицата — над кенчето. */}
      <div className="pointer-events-none sticky top-0 z-30 -mt-[100svh] h-svh">
        <div
          className="absolute inset-0 bg-bone"
          style={{ opacity: "clamp(0, calc(1 - max(var(--p, 0) - 0.3, 0.3 - var(--p, 0)) * 22), 1)" }}
          aria-hidden
        />
      </div>
    </section>
  );
}
