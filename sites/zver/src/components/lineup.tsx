import { FLAVOURS } from "../data/flavours";
import { useStore } from "../lib/store";
import { scrollToId } from "../lib/scroll";
import { stageRef } from "../lib/stage-ref";
import { Eyebrow } from "./bits";

/** Шестте кенчета в редица на кремав фон. Посоченото подскача и се върти. */
export function Lineup() {
  const { sel, setSel } = useStore();
  const hover = (i: number) => {
    if (stageRef.current) stageRef.current.hover = i;
  };

  return (
    <section id="line" data-stage="line" className="relative h-[170svh] text-black" aria-labelledby="line-h">
      <div className="sticky top-0 flex h-svh flex-col px-4 pt-20 pb-6 sm:px-8 md:pt-24">
        <div className="relative z-20 md:flex md:items-end md:justify-between md:gap-8">
          <div>
            <Eyebrow n="04" className="mb-3">
              The lineup
            </Eyebrow>
            <h2 id="line-h" className="display text-heading">
              Six ways
              <br />
              <span className="bg-black px-[0.08em] text-[var(--f-hi)] [box-decoration-break:clone]">to stay up.</span>
            </h2>
          </div>
          <p className="mt-3 max-w-xs text-lead font-medium md:mt-0">All sugar-free. All 160 mg of caffeine. Different only in how they hit.</p>
        </div>

        <ul className="relative z-20 mt-4 grid flex-1 grid-cols-3 gap-x-2 gap-y-3 md:mt-6 md:grid-cols-6 md:gap-4">
          {FLAVOURS.map((f, i) => (
            <li key={f.id} className="flex min-h-0">
              <button
                type="button"
                onPointerEnter={() => hover(i)}
                onPointerLeave={() => hover(-1)}
                onFocus={() => hover(i)}
                onBlur={() => hover(-1)}
                onClick={() => {
                  setSel(i);
                  scrollToId("shop");
                }}
                className="group flex min-h-0 w-full flex-col text-left"
                aria-label={`${f.name} — ${f.fruit}. Go to shop`}
              >
                <span data-anchor={`line-${i}`} className="mx-auto block min-h-0 w-full flex-1" aria-hidden />
                <span className={`mt-2 border-t-[3px] border-black pt-2 ${i === sel ? "" : ""}`}>
                  <span className="label flex items-center gap-2">
                    <span className="inline-block h-3 w-3 border-2 border-black" style={{ background: f.can }} />0{i + 1}
                  </span>
                  <span className="display mt-1 block text-[clamp(0.85rem,1.5vw,1.35rem)] leading-none group-hover:underline group-hover:decoration-[3px] group-hover:underline-offset-4">
                    {f.name}
                  </span>
                  <span className="mt-1 hidden text-body font-semibold opacity-70 md:block">{f.fruit}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
