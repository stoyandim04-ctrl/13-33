import * as React from "react";

import { useContent } from "@/data/content";
import { useReducedMotion } from "@/hooks/use-media";

/**
 * A real sequence, told by the scroll: the section is pinned while the four
 * steps take their turn - a large numeral changes, the step's words rise in,
 * a hairline fills. Reduced motion: a plain list of the four steps.
 */
export function Process() {
  const { process } = useContent();
  const reduced = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const bar = React.useRef<HTMLSpanElement>(null);
  const [step, setStep] = React.useState(0);
  const n = process.steps.length;

  React.useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const draw = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      if (bar.current) bar.current.style.transform = `scaleX(${p.toFixed(4)})`;
      setStep(Math.min(n - 1, Math.floor(p * n * 0.999)));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    draw();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reduced, n]);

  if (reduced) {
    return (
      <section id="proces" aria-labelledby="proces-title" className="section bg-surface">
        <div className="container-wide">
          <p className="eyebrow mb-5">{process.label}</p>
          <h2 id="proces-title" className="font-display text-heading font-[300] tracking-[-0.05em]">{process.title}</h2>
          <ol className="mt-16 grid gap-10 md:grid-cols-4">
            {process.steps.map((s, i) => (
              <li key={s.name}>
                <span className="text-muted-foreground text-sm tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="font-display text-title mt-2 font-[300]">{s.name}</h3>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  const current = process.steps[step];
  return (
    <section ref={ref} id="proces" aria-labelledby="proces-title" className="bg-surface relative h-[340svh]">
      <div className="sticky top-0 flex h-svh flex-col px-5 pt-28 pb-10 sm:px-8 md:pt-32 lg:px-14">
        <div className="container-wide flex flex-1 flex-col">
          <header>
            <p className="eyebrow mb-5">{process.label}</p>
            <h2 id="proces-title" className="font-display text-heading font-[300] tracking-[-0.05em] text-balance">
              {process.title}
            </h2>
          </header>

          <div className="grid flex-1 items-end gap-8 md:grid-cols-12">
            <p
              key={`n${step}`}
              aria-hidden="true"
              className="step-in font-display text-[clamp(8rem,4rem+22vw,24rem)] leading-[0.8] font-[200] tracking-[-0.08em] tabular-nums md:col-span-7"
            >
              {String(step + 1).padStart(2, "0")}
            </p>
            <div key={`t${step}`} className="step-in pb-4 md:col-span-5 md:pb-10" style={{ animationDelay: "80ms" }}>
              <h3 className="font-display text-[clamp(2.5rem,1.2rem+4vw,5.5rem)] leading-[1] font-[300] tracking-[-0.05em]">{current.name}</h3>
            </div>
          </div>

          {/* The four steps along a hairline that fills with the scroll. */}
          <div className="mt-8">
            <div className="bg-border relative h-px overflow-hidden">
              <span ref={bar} className="bg-foreground absolute inset-0 origin-left scale-x-0" />
            </div>
            <ol className="mt-4 grid grid-cols-4 gap-4 text-sm">
              {process.steps.map((s, i) => (
                <li key={s.name} aria-current={i === step ? "step" : undefined} className={i <= step ? "text-foreground transition-colors duration-500" : "text-muted-foreground/60 transition-colors duration-500"}>
                  <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ml-2 hidden sm:inline">{s.name}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
